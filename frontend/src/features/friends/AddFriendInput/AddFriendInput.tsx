// src/features/friends/AddFriendInput/AddFriendInput.tsx

import { useState, useCallback, useRef } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { friendsService } from '@/services/friends.service';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { UserSearchResult } from '@/types';
import styles from './AddFriendInput.module.css';

export interface AddFriendInputProps {
  onRequestSent?: () => void;
}

export function AddFriendInput({ onRequestSent }: AddFriendInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      }, 300);
    },
    []
  );

  const handleSendRequest = useCallback(
    async (userId: string) => {
      setSendingId(userId);
      try {
        await friendsService.sendRequest(userId);
        onRequestSent?.();
        // remove that user from local results so the button disappears
        setResults((prev) => prev.filter((u) => u.id !== userId));
      } finally {
        setSendingId(null);
      }
    },
    [onRequestSent]
  );

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
        {isSearching && (
          <Loader2 size={16} className={styles.spinner} />
        )}
      </div>

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
                iconLeft={<UserPlus size={14} />}
                onClick={() => handleSendRequest(user.id)}
                loading={sendingId === user.id}
                disabled={sendingId !== null}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}