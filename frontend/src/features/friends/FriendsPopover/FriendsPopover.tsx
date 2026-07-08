// src/features/friends/FriendsPopover/FriendsPopover.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { FriendsList } from '@/features/friends/FriendsList';
import { IncomingRequestList } from '@/features/friends/IncomingRequestList';
import { OutgoingRequestList } from '@/features/friends/OutgoingRequestList';
import { AddFriendInput } from '@/features/friends/AddFriendInput';
import type { Friendship } from '@/types';
import styles from './FriendsPopover.module.css';

type Tab = 'friends' | 'incoming' | 'outgoing';

export interface FriendsPopoverProps {
  onClose: () => void;
  onChallenge?: (friend: Friendship) => void;
}

export function FriendsPopover({ onClose, onChallenge }: FriendsPopoverProps) {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const handleAction = useCallback(() => {
    // Placeholder for any additional side effects after an action
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'friends', label: 'Friends', icon: <Users size={14} /> },
    { key: 'incoming', label: 'Incoming', icon: <UserPlus size={14} /> },
    { key: 'outgoing', label: 'Outgoing', icon: <UserMinus size={14} /> },
  ];

  return (
    <div className={styles.popover} ref={panelRef}>
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
        {activeTab === 'friends' && (
          <>
            <AddFriendInput onRequestSent={handleAction} />
            <FriendsList
              showActions
              onChallenge={(friend) => {
                onChallenge?.(friend);
                onClose();
              }}
            />
          </>
        )}

        {activeTab === 'incoming' && (
          <IncomingRequestList onAction={handleAction} />
        )}

        {activeTab === 'outgoing' && (
          <OutgoingRequestList onAction={handleAction} />
        )}
      </div>
    </div>
  );
}