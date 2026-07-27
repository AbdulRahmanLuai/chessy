// src/pages/ProfilePage.tsx
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { GameHistoryList } from '@/features/profile/GameHistoryList';
import Spinner from '@/components/ui/Spinner';

export function ProfilePage() {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const userId = routeUserId ?? currentUser?.id ?? '';

  const { user, games, stats, isLoading, isLoadingMore, error, hasMore, loadMore } =
    useProfile(userId);

  if (isLoading) {
    return <Spinner size="lg" />;
  }

  if (error || !user) {
    return <p>{error ?? 'Profile not found.'}</p>;
  }

  return (
    <div>
      <ProfileHeader user={user} stats={stats} />
      <GameHistoryList
        games={games}
        viewerUserId={user.id}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

export default ProfilePage;