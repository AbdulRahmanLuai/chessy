// src/features/challenge/ChallengeSearch/ChallengeSearch.tsx

import { useState, useCallback, useRef } from 'react';
import { Search, Swords, Loader2 } from 'lucide-react';
import { usersService } from '@/services/users.service';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { UserSearchResult } from '@/types';
import styles from './ChallengeSearch.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallengeSearchProps {
  onChallenge: (user: UserSearchResult) => void;
  /** True while an outgoing challenge already exists — only one can be active at a time */
  disabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

// ─── Component ────────────────────────────────────────────────────────────────

export function ChallengeSearch({ onChallenge, disabled = false }: ChallengeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await usersService.searchByUsername(value.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <Input
          placeholder="Search by username..."
          value={query}
          onChange={handleChange}
          iconLeft={<Search size={16} />}
          className={styles.input}
        />
        {isSearching && <Loader2 size={16} className={styles.spinner} />}
      </div>

      {disabled && (
        <p className={styles.hintText}>Cancel your pending challenge to send a new one.</p>
      )}

      {!isSearching && query.trim() && results.length === 0 && (
        <p className={styles.emptyText}>No users found.</p>
      )}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((user) => (
            <li key={user.id} className={styles.resultItem}>
              <Avatar username={user.displayName} size="sm" />
              <span className={styles.userInfo}>
                <span className={styles.displayName}>{user.displayName}</span>
                <span className={styles.username}>@{user.username}</span>
              </span>
              <Button
                size="sm"
                variant="primary"
                iconLeft={<Swords size={14} />}
                onClick={() => onChallenge(user)}
                disabled={disabled}
              >
                Challenge
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}