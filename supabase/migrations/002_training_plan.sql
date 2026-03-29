-- Training plan weeks table
CREATE TABLE IF NOT EXISTS training_plan_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 13),
  phase TEXT NOT NULL CHECK (phase IN ('recovery', 'base', 'marathon_specific', 'taper')),
  phase_label TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_distance_km NUMERIC(6,2),
  is_current BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

CREATE INDEX IF NOT EXISTS training_plan_weeks_user_idx ON training_plan_weeks(user_id);
CREATE INDEX IF NOT EXISTS training_plan_weeks_date_idx ON training_plan_weeks(user_id, week_start_date);

-- Training plan workouts table
CREATE TABLE IF NOT EXISTS training_plan_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_id UUID NOT NULL REFERENCES training_plan_weeks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
  scheduled_date DATE NOT NULL,
  -- Workout details
  workout_type TEXT NOT NULL CHECK (
    workout_type IN ('REST', 'EASY', 'TEMPO', 'MP', 'INTERVALS', 'LONG', 'RACE', 'SHAKEOUT')
  ),
  distance_km NUMERIC(6,2),
  description TEXT NOT NULL,
  -- Target metrics
  target_pace_min_per_km NUMERIC(5,2),
  target_hr_zone INTEGER CHECK (target_hr_zone >= 1 AND target_hr_zone <= 5),
  notes TEXT,
  -- Completion
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  linked_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scheduled_date, workout_type)
);

CREATE INDEX IF NOT EXISTS training_plan_workouts_user_idx ON training_plan_workouts(user_id);
CREATE INDEX IF NOT EXISTS training_plan_workouts_date_idx ON training_plan_workouts(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS training_plan_workouts_week_idx ON training_plan_workouts(week_id);

-- Enable RLS
ALTER TABLE training_plan_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_plan_weeks
CREATE POLICY "Users can view own training weeks" ON training_plan_weeks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training weeks" ON training_plan_weeks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training weeks" ON training_plan_weeks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training weeks" ON training_plan_weeks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for training_plan_workouts
CREATE POLICY "Users can view own workouts" ON training_plan_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON training_plan_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON training_plan_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON training_plan_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_training_plan_weeks_updated_at BEFORE UPDATE ON training_plan_weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_training_plan_workouts_updated_at BEFORE UPDATE ON training_plan_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
