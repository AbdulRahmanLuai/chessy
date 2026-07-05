import { useState } from 'react';
import { Link2, Copy, Check, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './InviteLinkCard.module.css';

export default function InviteLinkCard() {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = () => {
    // TODO: Call invite.service to create an invite
    // For now, mock a link
    const mockCode = Math.random().toString(36).substring(2, 8);
    setInviteLink(`${window.location.origin}/invite/${mockCode}`);
    setCopied(false);
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Link2 size={24} className={styles.icon} />
        <h2 className={styles.heading}>Invite Link</h2>
      </div>
      <p className={styles.description}>
        Generate a shareable link that anyone can use to join your game.
      </p>

      {inviteLink ? (
        <div className={styles.linkContainer}>
          <div className={styles.linkDisplay}>{inviteLink}</div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={copyLink} className={styles.actionButton}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="ghost" onClick={generateLink} className={styles.actionButton}>
              <RefreshCw size={16} />
              New
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" fullWidth onClick={generateLink}>
          Generate Invite Link
        </Button>
      )}
    </div>
  );
}