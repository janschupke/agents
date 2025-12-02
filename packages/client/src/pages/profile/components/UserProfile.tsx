import { PageContainer, PageHeader } from '../../../components/ui/layout';
import { useUserDisplay } from '../hooks/use-user-display';
import ProfileHeader from './ProfileHeader';
import UserDetails from './UserDetails';
import ApiKeySection from './ApiKeySection';
import ProfileSkeleton from './ProfileSkeleton';

export default function UserProfile() {
  const { displayUser, loadingUser } = useUserDisplay();

  return (
    <PageContainer>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader title="User Profile" />
        <div className="flex-1 overflow-y-auto p-8">
          {loadingUser ? (
            <ProfileSkeleton />
          ) : (
            <div className="space-y-6">
              <ProfileHeader user={displayUser} />
              <UserDetails user={displayUser} />
              <ApiKeySection />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
