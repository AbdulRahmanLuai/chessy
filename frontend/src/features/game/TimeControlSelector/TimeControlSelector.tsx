// src/features/game/TimeControlSelector/TimeControlSelector.tsx
import type { TimeControl } from '@/types';
import styles from './TimeControlSelector.module.css';

export interface TimeControlPreset {
  label: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical';
  timeControl: TimeControl;
}

export interface TimeControlSelectorProps {
  value: TimeControl;
  onChange: (timeControl: TimeControl) => void;
  disabled?: boolean;
}

// Cosmetic-only for now — selecting a preset updates local UI state via
// onChange, but nothing downstream (challenge payload, GameService) reads it
// yet. Backend hardcodes 10+0 regardless of what's picked here. See known gap
// #1 in project context.
const PRESETS: TimeControlPreset[] = [
  { label: '1+0', category: 'Bullet', timeControl: { initialSeconds: 60, incrementSeconds: 0 } },
  { label: '2+1', category: 'Bullet', timeControl: { initialSeconds: 120, incrementSeconds: 1 } },
  { label: '3+0', category: 'Blitz', timeControl: { initialSeconds: 180, incrementSeconds: 0 } },
  { label: '3+2', category: 'Blitz', timeControl: { initialSeconds: 180, incrementSeconds: 2 } },
  { label: '5+0', category: 'Blitz', timeControl: { initialSeconds: 300, incrementSeconds: 0 } },
  { label: '5+3', category: 'Blitz', timeControl: { initialSeconds: 300, incrementSeconds: 3 } },
  { label: '10+0', category: 'Rapid', timeControl: { initialSeconds: 600, incrementSeconds: 0 } },
  { label: '15+10', category: 'Rapid', timeControl: { initialSeconds: 900, incrementSeconds: 10 } },
  { label: '30+0', category: 'Classical', timeControl: { initialSeconds: 1800, incrementSeconds: 0 } },
];

function isSamePreset(a: TimeControl, b: TimeControl): boolean {
  return a.initialSeconds === b.initialSeconds && a.incrementSeconds === b.incrementSeconds;
}

export function TimeControlSelector({ value, onChange, disabled = false }: TimeControlSelectorProps) {
  const categories: TimeControlPreset['category'][] = ['Bullet', 'Blitz', 'Rapid', 'Classical'];

  return (
    <div className={styles.wrapper}>
      <span className={styles.hint}>Time control (not yet active)</span>
      {categories.map((category) => {
        const presetsForCategory = PRESETS.filter((preset) => preset.category === category);
        return (
          <div key={category} className={styles.categoryRow}>
            <span className={styles.categoryLabel}>{category}</span>
            <div className={styles.presetGroup}>
              {presetsForCategory.map((preset) => {
                const isSelected = isSamePreset(preset.timeControl, value);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={disabled}
                    className={isSelected ? styles.presetButtonSelected : styles.presetButton}
                    onClick={() => onChange(preset.timeControl)}
                    aria-pressed={isSelected}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}