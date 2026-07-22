// src/features/friends/ChallengeFriendModal/ChallengeFriendModal.tsx

import Modal from '@/components/ui/Modal';
import { ChallengeSetupPanel } from '@/features/game/ChallengeSetupPanel';
import type { Friendship } from '@/types';

export interface ChallengeFriendModalProps {
  friend: Friendship | null;
  onClose: () => void;
}

export function ChallengeFriendModal({
  friend,
  onClose,
}: ChallengeFriendModalProps) {
  return (
    <Modal
      isOpen={friend !== null}
      onClose={onClose}
      title={
        friend
          ? `Challenge @${friend.otherUsername}`
          : 'Challenge Friend'
      }
      size="md"
    >
      {friend && (
        <ChallengeSetupPanel
          presetFriend={friend}
          onChallengeSent={onClose}
        />
      )}
    </Modal>
  );
}