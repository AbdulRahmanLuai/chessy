// src/features/challenge/ChallengesButton/ChallengesButton.tsx

import { useState, useRef, useEffect } from 'react';
import { Swords, Inbox, Send, Search as SearchIcon } from 'lucide-react';
import { useChallenge } from '@/hooks/useChallenge';
import { ChallengeSearch } from '@/features/challenge/ChallengeSearch';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { UserSearchResult } from '@/types';
import styles from './ChallengesButton.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'incoming' | 'outgoing' | 'search';

export interface ChallengesButtonProps {
  className?: string;
  onChallengeUser?: (user: UserSearchResult) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Global entry point (lives in Navbar) for incoming + outgoing challenges,
// plus searching for a new opponent to challenge. Deliberately does NOT
// navigate on accept. Navigation on challenge:accepted is handled once,
// globally, by useAcceptedChallengeRedirect in AppLayout, since this button
// and WaitingForOpponent are both mounted at all times.
//
// This is a permanent nav item (replaces the old Swords/Lobby link) and
// always renders, even with zero active challenges.
export function ChallengesButton({ className, onChallengeUser }: ChallengesButtonProps) {
  const { incomingChallenges, outgoingChallenge, acceptChallenge, declineChallenge, cancelChallenge } =
    useChallenge();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const incoming = Object.values(incomingChallenges);
  const count = incoming.length + (outgoingChallenge ? 1 : 0);

  const classNames = [styles.wrapper, className ?? ''].filter(Boolean).join(' ');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'incoming', label: 'Incoming', icon: <Inbox size={14} /> },
    { key: 'outgoing', label: 'Outgoing', icon: <Send size={14} /> },
    { key: 'search', label: 'Search', icon: <SearchIcon size={14} /> },
  ];

  return (
    <div className={classNames} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Challenges"
      >
        <Swords size={18} />
        <span>Challenge</span>
       {count > 0 && <Badge count={count} variant="danger" size="sm" />}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
                aria-selected={activeTab === tab.key}
                role="tab"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            {activeTab === 'incoming' &&
              (incoming.length === 0 ? (
                <p className={styles.emptyText}>No incoming challenges.</p>
              ) : (
                <ul className={styles.list}>
                  {incoming.map((challenge) => (
                    <li key={challenge.challengeId} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <span className={styles.displayName}>{challenge.fromDisplayName}</span>
                        <span className={styles.username}>@{challenge.fromUsername}</span>
                        <span className={styles.colorNote}>
                          You'd play as{' '}
                          {challenge.preferredColor === 'RANDOM' ? 'random' : challenge.preferredColor.toLowerCase()}
                        </span>
                      </div>
                      <div className={styles.itemActions}>
                        <Button variant="primary" size="sm" onClick={() => acceptChallenge(challenge.challengeId)}>
                          Accept
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => declineChallenge(challenge.challengeId)}>
                          Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ))}

            {activeTab === 'outgoing' &&
              (outgoingChallenge ? (
                <ul className={styles.list}>
                  <li className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.displayName}>{outgoingChallenge.toDisplayName}</span>
                      <span className={styles.username}>@{outgoingChallenge.toUsername}</span>
                    </div>
                    <div className={styles.itemActions}>
                      <Button variant="secondary" size="sm" onClick={cancelChallenge}>
                        Cancel
                      </Button>
                    </div>
                  </li>
                </ul>
              ) : (
                <p className={styles.emptyText}>No outgoing challenge.</p>
              ))}

            {activeTab === 'search' && (
              <ChallengeSearch
                disabled={!!outgoingChallenge}
                onChallenge={(user) => {
                  onChallengeUser?.(user);
                  setIsOpen(false);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}