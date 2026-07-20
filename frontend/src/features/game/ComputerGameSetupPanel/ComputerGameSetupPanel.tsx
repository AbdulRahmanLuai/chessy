// src/features/game/ComputerGameSetupPanel/ComputerGameSetupPanel.tsx

import { useState, useCallback } from 'react';
import { TimeControlSelector } from '@/features/game/TimeControlSelector';
import Button from '@/components/ui/Button';
import type {
  TimeControl,
  ComputerGameDifficulty,
  ColorPreference,
  CreateComputerGameRequest,
} from '@/types';
import styles from './ComputerGameSetupPanel.module.css';

export interface ComputerGameSetupPanelProps {
  className?: string;
  onSubmit: (settings: CreateComputerGameRequest) => void;
  isSubmitting?: boolean;
}

const DEFAULT_TIME_CONTROL: TimeControl = {
  initialSeconds: 600,
  incrementSeconds: 0,
};

const DIFFICULTIES: ComputerGameDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const DIFFICULTY_LABELS: Record<ComputerGameDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export function ComputerGameSetupPanel({
  className,
  onSubmit,
  isSubmitting = false,
}: ComputerGameSetupPanelProps) {
  const [isTimed, setIsTimed] = useState(true);
  const [timeControl, setTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [difficulty, setDifficulty] = useState<ComputerGameDifficulty>('MEDIUM');
  const [colorPreference, setColorPreference] = useState<ColorPreference>('RANDOM');

  const handleSubmit = useCallback(() => {
    onSubmit({
      difficulty,
      engine: 'RANDOM',
      isTimed,
      timeInitialSeconds: isTimed ? timeControl.initialSeconds : undefined,
      timeIncrementSeconds: isTimed ? timeControl.incrementSeconds : undefined,
      colorPreference,
    });
  }, [difficulty, isTimed, timeControl, colorPreference, onSubmit]);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {/* ── Timed toggle ────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Time control</span>
        <div className={styles.toggleRow}>
          <Button
            variant={isTimed ? 'primary' : 'secondary'}
            onClick={() => setIsTimed(true)}
            disabled={isSubmitting}
          >
            Timed
          </Button>
          <Button
            variant={!isTimed ? 'primary' : 'secondary'}
            onClick={() => setIsTimed(false)}
            disabled={isSubmitting}
          >
            Untimed
          </Button>
        </div>

        {isTimed && (
          <TimeControlSelector
            value={timeControl}
            onChange={setTimeControl}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* ── Engine (locked — Random only for now) ──────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Engine</span>
        <div className={styles.toggleRow}>
          <Button variant="primary" disabled>
            Random Engine
          </Button>
          <Button variant="secondary" disabled title="Coming soon">
            Stockfish
          </Button>
        </div>
      </div>

      {/* ── Difficulty ──────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Difficulty</span>
        <div className={styles.toggleRow}>
          {DIFFICULTIES.map((level) => (
            <Button
              key={level}
              variant={difficulty === level ? 'primary' : 'secondary'}
              onClick={() => setDifficulty(level)}
              disabled={isSubmitting}
            >
              {DIFFICULTY_LABELS[level]}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Color preference ────────────────────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Play as</span>
        <div className={styles.toggleRow}>
          {(['WHITE', 'RANDOM', 'BLACK'] as ColorPreference[]).map((color) => (
            <Button
              key={color}
              variant={colorPreference === color ? 'primary' : 'secondary'}
              onClick={() => setColorPreference(color)}
              disabled={isSubmitting}
            >
              {color === 'RANDOM' ? 'Random' : color === 'WHITE' ? 'White' : 'Black'}
            </Button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.playButton}
        disabled={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Starting…' : 'Play'}
      </button>
    </div>
  );
}