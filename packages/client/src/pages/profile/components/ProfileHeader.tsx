import { User } from '../../../../types/chat.types';

interface ProfileHeaderProps {
  user: User;
}

/**
 * Profile header component displaying user avatar and name
 */
export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-6">
      {user.imageUrl ? (
        <img
          src={user.imageUrl}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-border"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-text-inverse text-3xl font-semibold border-4 border-border">
          {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h3 className="text-xl font-semibold text-text-primary">
          {user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : 'User'}
        </h3>
        {user.email && (
          <p className="text-text-secondary mt-1">{user.email}</p>
        )}
      </div>
    </div>
  );
}
