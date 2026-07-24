import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './MoveNavigator.module.css';

export interface MoveNavigatorProps {
  isAtStart: boolean;
  isAtEnd: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  className?: string;
}

export default function MoveNavigator({
  isAtStart,
  isAtEnd,
  onFirst,
  onPrev,
  onNext,
  onLast,
  className,
}: MoveNavigatorProps) {
  return (
    <div className={`${styles.root} ${className ?? ''}`} role="group" aria-label="Move navigation">
      <Button
        variant="ghost"
        size="sm"
        className={styles.navButton}
        iconLeft={<ChevronsLeft size={18} />}
        onClick={onFirst}
        disabled={isAtStart}
        aria-label="Go to start"
      />
      <Button
        variant="ghost"
        size="sm"
        className={styles.navButton}
        iconLeft={<ChevronLeft size={18} />}
        onClick={onPrev}
        disabled={isAtStart}
        aria-label="Previous move"
      />

      <span className={styles.divider} aria-hidden="true" />

      <Button
        variant="ghost"
        size="sm"
        className={styles.navButton}
        iconLeft={<ChevronRight size={18} />}
        onClick={onNext}
        disabled={isAtEnd}
        aria-label="Next move"
      />
      <Button
        variant="ghost"
        size="sm"
        className={styles.navButton}
        iconLeft={<ChevronsRight size={18} />}
        onClick={onLast}
        disabled={isAtEnd}
        aria-label="Go to latest move"
      />
    </div>
  );
}