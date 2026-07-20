import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './PlayComputerCard.module.css';

export default function PlayComputerCard() {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate('/play/computer');
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

      <Button
        variant="primary"
        fullWidth
        onClick={handlePlay}
        className={styles.playButton}
      >
        Play with Computer
      </Button>
    </div>
  );
}