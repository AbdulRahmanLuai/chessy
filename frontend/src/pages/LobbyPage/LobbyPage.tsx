import PlayComputerCard from '@/features/lobby/PlayComputerCard/PlayComputerCard';
import ChallengeFriendCard from '@/features/lobby/ChallengeFriendCard/ChallengeFriendCard';
import InviteLinkCard from '@/features/lobby/InviteLinkCard/InviteLinkCard';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Lobby</h1>
      <p className={styles.subtitle}>Choose your game mode</p>
      <div className={styles.grid}>
        <PlayComputerCard />
        <ChallengeFriendCard />
        <InviteLinkCard />
      </div>
    </div>
  );
}