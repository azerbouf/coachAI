'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, RotateCcw } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import type { Activity } from '@/types/activity';

const STORAGE_KEY = 'activities-order';

interface Props {
  activities: Activity[];
  verdicts: Record<string, string>;
}

function loadOrder(activities: Activity[]): Activity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return activities;
    const ids: string[] = JSON.parse(saved);
    // Merge: saved order first, then any new activities not in saved order
    const idSet = new Set(ids);
    const byId = Object.fromEntries(activities.map((a) => [a.id, a]));
    const ordered = ids.filter((id) => byId[id]).map((id) => byId[id]);
    const newOnes = activities.filter((a) => !idSet.has(a.id));
    return [...ordered, ...newOnes];
  } catch {
    return activities;
  }
}

function saveOrder(activities: Activity[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities.map((a) => a.id)));
  } catch {}
}

export function ActivityListClient({ activities, verdicts }: Props) {
  const [items, setItems] = useState<Activity[]>(activities);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [customized, setCustomized] = useState(false);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Load saved order on mount
  useEffect(() => {
    const ordered = loadOrder(activities);
    setItems(ordered);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCustomized(true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image: transparent
    const ghost = document.createElement('div');
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(dropIdx, 0, moved);
      saveOrder(next);
      return next;
    });
    setCustomized(true);
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx]);

  const onDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  function resetOrder() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setItems(activities);
    setCustomized(false);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setReorderMode((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            reorderMode
              ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/30'
              : 'text-text-muted border-border hover:text-text-secondary hover:border-white/20'
          }`}
        >
          <GripVertical className="w-3.5 h-3.5" />
          {reorderMode ? 'Done reordering' : 'Reorder'}
        </button>

        {customized && (
          <button
            onClick={resetOrder}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset order
          </button>
        )}
      </div>

      {/* Cards */}
      {items.map((activity, idx) => {
        const isDragging = dragIdx === idx;
        const isOver = overIdx === idx && dragIdx !== idx;

        return (
          <div
            key={activity.id}
            ref={isDragging ? dragNode : null}
            draggable={reorderMode}
            onDragStart={reorderMode ? (e) => onDragStart(e, idx) : undefined}
            onDragOver={reorderMode ? (e) => onDragOver(e, idx) : undefined}
            onDrop={reorderMode ? (e) => onDrop(e, idx) : undefined}
            onDragEnd={reorderMode ? onDragEnd : undefined}
            className="relative"
            style={{
              opacity: isDragging ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {/* Drop indicator line */}
            {isOver && (
              <div
                className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-accent-purple z-10"
              />
            )}

            {/* Drag handle overlay */}
            {reorderMode && (
              <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-text-muted" />
              </div>
            )}

            <div style={reorderMode ? { paddingLeft: '2.5rem', cursor: 'grab' } : {}}>
              <ActivityCard
                activity={activity}
                coachVerdict={verdicts[activity.id]}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
