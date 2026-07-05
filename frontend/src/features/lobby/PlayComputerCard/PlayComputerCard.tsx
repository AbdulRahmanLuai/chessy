import { useState } from 'react';
import { Bot, Clock, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './PlayComputerCard.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
type TimeControl = 'bullet' | 'blitz' | 'rapid';

export default function PlayComputerCard() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeControl, setTimeControl] = useState<TimeControl>('blitz');

  const handlePlay = () => {
    // TODO: Call game.service to create computer game
    console.log('Play computer', { difficulty, timeControl });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Bot size={24} className={styles.icon} />
        <h2 className={styles.heading}>Play Computer</h2>
      </div>
      <p className={styles.description}>
        Challenge our AI at your preferred level.
      </p>

      <div className={styles.section}>
        <label className={styles.label}>Difficulty</label>
        <div className={styles.buttonGroup}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              className={`${styles.optionButton} ${difficulty === level ? styles.active : ''}`}
              onClick={() => setDifficulty(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Time Control</label>
        <div className={styles.buttonGroup}>
          {(['bullet', 'blitz', 'rapid'] as TimeControl[]).map((tc) => (
            <button
              key={tc}
              className={`${styles.optionButton} ${timeControl === tc ? styles.active : ''}`}
              onClick={() => setTimeControl(tc)}
            >
              {tc.charAt(0).toUpperCase() + tc.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handlePlay}
        className={styles.playButton}
      >
        Play
      </Button>
    </div>
  );
}