-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  -- Encrypted Garmin credentials
  garmin_email TEXT,
  garmin_credentials_encrypted TEXT, -- AES encrypted password
  garmin_last_sync TIMESTAMPTZ,
  garmin_sync_enabled BOOLEAN DEFAULT TRUE,
  -- Preferences
  preferred_pace_unit TEXT DEFAULT 'min/km' CHECK (preferred_pace_unit IN ('min/km', 'min/mile')),
  preferred_distance_unit TEXT DEFAULT 'km' CHECK (preferred_distance_unit IN ('km', 'mile')),
  timezone TEXT DEFAULT 'UTC',
  -- Training
  max_hr INTEGER,
  resting_hr INTEGER,
  lactate_threshold_hr INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  garmin_activity_id BIGINT UNIQUE,
  -- Core fields
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'running',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  -- Distance & Pace
  distance_meters NUMERIC(10,2),
  avg_pace_seconds_per_km NUMERIC(8,2),
  best_pace_seconds_per_km NUMERIC(8,2),
  -- Elevation
  elevation_gain_meters NUMERIC(8,2),
  elevation_loss_meters NUMERIC(8,2),
  max_elevation_meters NUMERIC(8,2),
  -- Heart Rate
  avg_hr INTEGER,
  max_hr INTEGER,
  -- Calories
  calories INTEGER,
  -- Training metrics
  training_effect_aerobic NUMERIC(4,2),
  training_effect_anaerobic NUMERIC(4,2),
  training_load NUMERIC(8,2),
  vo2max_estimate NUMERIC(5,2),
  lactate_threshold_hr INTEGER,
  -- Running dynamics
  avg_cadence INTEGER,
  avg_stride_length_cm NUMERIC(6,2),
  avg_vertical_oscillation_cm NUMERIC(6,2),
  avg_ground_contact_time_ms NUMERIC(8,2),
  avg_vertical_ratio NUMERIC(5,2),
  avg_ground_contact_balance NUMERIC(5,2),
  -- Splits data (stored as JSONB)
  splits JSONB DEFAULT '[]'::jsonb,
  hr_zones JSONB DEFAULT '{}'::jsonb,
  -- Weather
  temperature_celsius NUMERIC(5,2),
  weather_condition TEXT,
  -- Raw data for future use
  raw_data JSONB,
  -- Metadata
  is_analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_start_time_idx ON activities(start_time DESC);
CREATE INDEX IF NOT EXISTS activities_garmin_id_idx ON activities(garmin_activity_id);
CREATE INDEX IF NOT EXISTS activities_user_time_idx ON activities(user_id, start_time DESC);

-- Daily wellness table
CREATE TABLE IF NOT EXISTS daily_wellness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- HRV
  hrv_last_night_ms NUMERIC(6,2),
  hrv_baseline_low NUMERIC(6,2),
  hrv_baseline_high NUMERIC(6,2),
  hrv_status TEXT CHECK (hrv_status IN ('LOW', 'UNBALANCED', 'BALANCED', 'HIGH')),
  -- Sleep
  sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  sleep_duration_seconds INTEGER,
  sleep_deep_seconds INTEGER,
  sleep_rem_seconds INTEGER,
  sleep_light_seconds INTEGER,
  sleep_awake_seconds INTEGER,
  -- Body Battery
  body_battery_charged INTEGER CHECK (body_battery_charged >= 0 AND body_battery_charged <= 100),
  body_battery_drained INTEGER CHECK (body_battery_drained >= 0 AND body_battery_drained <= 100),
  body_battery_highest INTEGER CHECK (body_battery_highest >= 0 AND body_battery_highest <= 100),
  body_battery_lowest INTEGER CHECK (body_battery_lowest >= 0 AND body_battery_lowest <= 100),
  -- Stress
  avg_stress_level INTEGER CHECK (avg_stress_level >= 0 AND avg_stress_level <= 100),
  max_stress_level INTEGER CHECK (max_stress_level >= 0 AND max_stress_level <= 100),
  rest_stress_duration_seconds INTEGER,
  -- Respiration
  avg_waking_respiration_value NUMERIC(5,2),
  avg_spo2_value NUMERIC(5,2),
  -- Readiness
  training_readiness_score INTEGER CHECK (training_readiness_score >= 0 AND training_readiness_score <= 100),
  training_readiness_description TEXT,
  -- Daily steps
  total_steps INTEGER,
  daily_step_goal INTEGER,
  -- Resting HR
  resting_hr INTEGER,
  -- Metadata
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_wellness_user_date_idx ON daily_wellness(user_id, date DESC);

-- Coach analyses table
CREATE TABLE IF NOT EXISTS coach_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- What was analyzed
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('activity', 'daily_tip', 'weekly_summary')),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  analysis_date DATE,
  week_start_date DATE,
  -- Claude response
  headline TEXT,
  summary TEXT,
  full_analysis JSONB,
  -- Cache control
  model_used TEXT DEFAULT 'claude-opus-4-5',
  tokens_used INTEGER,
  cached_until TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coach_analyses_user_id_idx ON coach_analyses(user_id);
CREATE INDEX IF NOT EXISTS coach_analyses_activity_id_idx ON coach_analyses(activity_id);
CREATE INDEX IF NOT EXISTS coach_analyses_type_date_idx ON coach_analyses(user_id, analysis_type, analysis_date DESC);

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'wellness', 'activities')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  activities_synced INTEGER DEFAULT 0,
  wellness_days_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS sync_logs_user_id_idx ON sync_logs(user_id, started_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Daily wellness policies
CREATE POLICY "Users can view own wellness" ON daily_wellness
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness" ON daily_wellness
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness" ON daily_wellness
  FOR UPDATE USING (auth.uid() = user_id);

-- Coach analyses policies
CREATE POLICY "Users can view own analyses" ON coach_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON coach_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON coach_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Sync logs policies
CREATE POLICY "Users can view own sync logs" ON sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync logs" ON sync_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_wellness_updated_at BEFORE UPDATE ON daily_wellness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coach_analyses_updated_at BEFORE UPDATE ON coach_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
