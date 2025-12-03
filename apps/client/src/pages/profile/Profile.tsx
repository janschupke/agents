import { Container, PageHeader, PageContent } from '@openai/ui';
import { useUserDisplay } from './hooks/use-user-display';
import ProfileHeader from './components/UserProfile/parts/ProfileHeader';
import UserDetails from './components/UserProfile/parts/UserDetails';
import ApiKeySection from './components/ApiKeySection/ApiKeySection';
import ProfileSkeleton from './components/UserProfile/parts/ProfileSkeleton';

export default function Profile() {
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
