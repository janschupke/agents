import { User } from '../../../types/chat.types';
import { InfoField, Badge } from '@openai/ui';

interface UserDetailsProps {
  user: User;
}

/**
 * User details grid component displaying user information
 */
export default function UserDetails({ user }: UserDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoField
        label="User ID"
        value={<p className="font-mono text-sm break-all">{user.id}</p>}
      />

      {user.firstName && (
        <InfoField label="First Name" value={user.firstName} />
      )}

      {user.lastName && <InfoField label="Last Name" value={user.lastName} />}

      {user.email && <InfoField label="Email" value={user.email} />}

      <InfoField
        label="Roles"
        value={
          <div className="flex flex-wrap gap-2">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role: string, index: number) => (
                <Badge key={index}>{role}</Badge>
              ))
            ) : (
              <span className="text-text-secondary text-sm">
                No roles assigned
              </span>
            )}
          </div>
        }
      />
    </div>
  );
}
