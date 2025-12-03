import { Container, PageHeader, PageContent } from '@openai/ui';
import { useUserDisplay } from '../../hooks/use-user-display';
import ProfileHeader from './parts/ProfileHeader';
import UserDetails from './parts/UserDetails';
import ApiKeySection from '../ApiKeySection/ApiKeySection';
import ProfileSkeleton from './parts/ProfileSkeleton';

export default function UserProfile() {
  const { displayUser, loadingUser } = useUserDisplay();

  return (
    <Container>
      <PageHeader title="User Profile" />
      <PageContent>
        {loadingUser ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-6">
            <ProfileHeader user={displayUser} />
            <UserDetails user={displayUser} />
            <ApiKeySection />
          </div>
        )}
      </PageContent>
    </Container>
  );
}
