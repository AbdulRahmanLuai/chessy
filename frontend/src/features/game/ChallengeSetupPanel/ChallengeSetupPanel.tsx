// src/features/game/ChallengeSetupPanel/ChallengeSetupPanel.tsx

import { useEffect, useState, useCallback } from 'react';
import { useChallenge } from '@/hooks/useChallenge';
import { usersService } from '@/services/users.service';
import { FriendsList } from '@/features/friends/FriendsList';
import { TimeControlSelector } from '@/features/game/TimeControlSelector';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import type {
  ChallengeTargetMode,
  Friendship,
  UserSearchResult,
  TimeControl,
} from '@/types';
import type { PreferredColor } from '@/socket/events';
import styles from './ChallengeSetupPanel.module.css';

export interface ChallengeSetupPanelProps {
  className?: string;
  presetFriend?: Friendship;
  presetUser?: UserSearchResult;
  onChallengeSent?: () => void;
}

// Normalized shape covering both preset sources (a Friendship or a raw
// search result), so the rest of the component doesn't need to branch on
// which one was passed in.
interface PresetTarget {
  userId: string;
  username: string;
  displayName: string;
}

const DEFAULT_TIME_CONTROL: TimeControl = {
  initialSeconds: 600,
  incrementSeconds: 0,
};

const SEARCH_DEBOUNCE_MS = 300;

export function ChallengeSetupPanel({
  className,
  presetFriend,
  presetUser,
  onChallengeSent,
}: ChallengeSetupPanelProps) {
  const { outgoingChallenge, error, sendChallenge } = useChallenge();

  const presetTarget: PresetTarget | null = presetFriend
    ? {
        userId: presetFriend.otherUserId,
        username: presetFriend.otherUsername,
        displayName: presetFriend.otherDisplayName,
      }
    : presetUser
      ? {
          userId: presetUser.id,
          username: presetUser.username,
          displayName: presetUser.displayName,
        }
      : null;

  const lockedToTarget = presetTarget !== null;

  const [mode, setMode] = useState<ChallengeTargetMode>('friend');
  const [selectedFriend, setSelectedFriend] = useState<Friendship | null>(
    presetFriend ?? null
  );
  const [usernameQuery, setUsernameQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<UserSearchResult | null>(null);
  const [preferredColor, setPreferredColor] =
    useState<PreferredColor>('RANDOM');
  const [timeControl, setTimeControl] =
    useState<TimeControl>(DEFAULT_TIME_CONTROL);

  useEffect(() => {
    if (presetFriend) {
      setSelectedFriend(presetFriend);
    }
  }, [presetFriend]);

  useEffect(() => {
    if (mode !== 'username' || lockedToTarget) return;

    setSelectedUser(null);

    const trimmed = usernameQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await usersService.searchByUsername(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [usernameQuery, mode, lockedToTarget]);

  const handleModeChange = useCallback(
    (nextMode: ChallengeTargetMode) => {
      if (lockedToTarget) return;
      setMode(nextMode);
      setSelectedFriend(null);
      setSelectedUser(null);
      setUsernameQuery('');
      setSearchResults([]);
    },
    [lockedToTarget]
  );

  const targetUserId = lockedToTarget
    ? presetTarget!.userId
    : mode === 'friend'
      ? selectedFriend?.otherUserId ?? null
      : selectedUser?.id ?? null;

  const canSend = targetUserId !== null && !outgoingChallenge;

  const handleSend = useCallback(() => {
  if (!targetUserId) return;

  sendChallenge(
    targetUserId,
    timeControl.initialSeconds,
    timeControl.incrementSeconds,
    preferredColor
  );

  onChallengeSent?.();
}, [
  targetUserId,
  timeControl,
  preferredColor,
  sendChallenge,
  onChallengeSent,
]);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {!lockedToTarget && (
        <>
          <div className={styles.modeToggle}>
            <Button
              variant={mode === 'friend' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleModeChange('friend')}
              disabled={!!outgoingChallenge}
            >
              Friend
            </Button>
            <Button
              variant={mode === 'username' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleModeChange('username')}
              disabled={!!outgoingChallenge}
            >
              Username
            </Button>
          </div>

          <div className={styles.targetSection}>
            {mode === 'friend' ? (
              <FriendsList
                onSelectFriend={setSelectedFriend}
                selectedFriendId={selectedFriend?.otherUserId ?? null}
              />
            ) : (
              <div className={styles.usernameSearch}>
                <Input
                  value={usernameQuery}
                  onChange={(e) => setUsernameQuery(e.target.value)}
                  placeholder="Search username…"
                  disabled={!!outgoingChallenge}
                />
                {isSearching && (
                  <div className={styles.searchSpinner}>
                    <Spinner />
                  </div>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <ul className={styles.resultsList}>
                    {searchResults.map((user) => {
                      const isSelected = user.id === selectedUser?.id;
                      return (
                        <li key={user.id}>
                          <button
                            type="button"
                            className={
                              isSelected
                                ? styles.resultRowSelected
                                : styles.resultRow
                            }
                            onClick={() => setSelectedUser(user)}
                            aria-pressed={isSelected}
                          >
                            <span className={styles.displayName}>
                              {user.displayName}
                            </span>
                            <span className={styles.username}>
                              @{user.username}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!isSearching &&
                  usernameQuery.trim() &&
                  searchResults.length === 0 && (
                    <p className={styles.emptyText}>No users found.</p>
                  )}
              </div>
            )}
          </div>
        </>
      )}

      {lockedToTarget && presetTarget && (
        <div className={styles.targetSection}>
          <div className={styles.resultRowSelected}>
            <span className={styles.displayName}>
              {presetTarget.displayName}
            </span>
            <span className={styles.username}>
              @{presetTarget.username}
            </span>
          </div>
        </div>
      )}

      <div className={styles.colorSection}>
        <span className={styles.sectionLabel}>Play as</span>
        <div className={styles.colorToggle}>
          {(['WHITE', 'RANDOM', 'BLACK'] as PreferredColor[]).map(
            (color) => (
              <Button
                key={color}
                variant={
                  preferredColor === color ? 'primary' : 'secondary'
                }
                size="sm"
                onClick={() => setPreferredColor(color)}
                disabled={!!outgoingChallenge}
              >
                {color === 'RANDOM'
                  ? 'Random'
                  : color === 'WHITE'
                    ? 'White'
                    : 'Black'}
              </Button>
            )
          )}
        </div>
      </div>

      <TimeControlSelector
        value={timeControl}
        onChange={setTimeControl}
        disabled={!!outgoingChallenge}
      />

      {error && <p className={styles.errorText}>{error}</p>}

      {/* Plain button fix */}
      <button
        type="button"
        className={styles.sendButton}
        disabled={!canSend}
        onClick={handleSend}
      >
        Send Challenge
      </button>
    </div>
  );
}