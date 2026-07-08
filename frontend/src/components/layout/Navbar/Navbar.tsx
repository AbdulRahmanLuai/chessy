// src/components/layout/Navbar/Navbar.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, User, Users, Swords } from 'lucide-react';
import { IncomingChallengesButton } from '@/features/challenge/IncomingChallengesButton';
import { FriendsPopover } from '@/features/friends/FriendsPopover';
import { ChallengeSetupPanel } from '@/features/game/ChallengeSetupPanel';
import Modal from '@/components/ui/Modal';
import type { Friendship, User as UserType } from '../../../types';
import styles from './Navbar.module.css';

export interface NavbarProps {
  user?: UserType | null;
  onLogout?: () => void;
  isLoading?: boolean;
}

export default function Navbar({ user, onLogout, isLoading = false }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [challengeFriend, setChallengeFriend] = useState<Friendship | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const friendsButtonRef = useRef<HTMLButtonElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close profile dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout?.();
  };

  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden="true">♟</span>
          <span className={styles.logoText}>Chessy</span>
        </Link>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/lobby" className={styles.navLink}>
            <Swords size={18} />
            <span>Lobby</span>
          </Link>

          {user && (
            <button
              ref={friendsButtonRef}
              className={styles.navLink}
              onClick={() => setIsFriendsOpen((prev) => !prev)}
              type="button"
              aria-expanded={isFriendsOpen}
              aria-haspopup="true"
            >
              <Users size={18} />
              <span>Friends</span>
            </button>
          )}
        </nav>

        {/* User Menu */}
        <div className={styles.userMenu} ref={dropdownRef}>
          {user ? (
            <>
              <IncomingChallengesButton className={styles.challengesButton} />

              <button
                className={styles.trigger}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
                disabled={isLoading}
              >
                <span className={styles.userName}>{user.username}</span>
                <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdown} role="menu">
                  <Link
                    to={`/profile/${user.username}`}
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <button
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    <LogOut size={16} />
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.guestActions}>
              <Link to="/login" className={styles.loginLink}>Sign in</Link>
              <Link to="/register" className={styles.registerLink}>Get started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Friends Popover (dropdown) */}
      {isFriendsOpen && (
        <div className={styles.popoverAnchor}>
          <FriendsPopover
            onClose={() => setIsFriendsOpen(false)}
            onChallenge={(friend) => {
              setChallengeFriend(friend);
            }}
          />
        </div>
      )}

      {/* Challenge Modal (opened from popover) */}
      <Modal
        isOpen={challengeFriend !== null}
        onClose={() => setChallengeFriend(null)}
        title="Challenge Friend"
      >
        {challengeFriend && (
          <ChallengeSetupPanel
            presetFriend={challengeFriend}
            onChallengeSent={() => setChallengeFriend(null)}
          />
        )}
      </Modal>
    </header>
  );
}