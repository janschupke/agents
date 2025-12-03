import { User } from '../../../../../types/chat.types';
import { Avatar } from '@openai/ui';

interface ProfileHeaderProps {
  user: User;
}

/**
 * Profile header component displaying user avatar and name
 */
export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : user.email || 'User';

  return (
    <div className="flex items-center gap-6">
      <Avatar
        src={user.imageUrl || undefined}
        name={user.firstName || user.email || 'U'}
        size="lg"
        borderWidth="md"
      />
      <div>
        <h3 className="text-xl font-semibold text-text-primary">
          {displayName}
        </h3>
        {user.email && <p className="text-text-secondary mt-1">{user.email}</p>}
      </div>
    </div>
  );
}
