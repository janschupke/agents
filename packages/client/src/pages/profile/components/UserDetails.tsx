import { User } from '../../../types/chat.types';

interface UserDetailsProps {
  user: User;
}

/**
 * User details grid component displaying user information
 */
export default function UserDetails({ user }: UserDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="text-sm font-medium text-text-secondary">
          User ID
        </label>
        <p className="mt-1 text-text-primary font-mono text-sm break-all">
          {user.id}
        </p>
      </div>

      {user.firstName && (
        <div>
          <label className="text-sm font-medium text-text-secondary">
            First Name
          </label>
          <p className="mt-1 text-text-primary">{user.firstName}</p>
        </div>
      )}

      {user.lastName && (
        <div>
          <label className="text-sm font-medium text-text-secondary">
            Last Name
          </label>
          <p className="mt-1 text-text-primary">{user.lastName}</p>
        </div>
      )}

      {user.email && (
        <div>
          <label className="text-sm font-medium text-text-secondary">
            Email
          </label>
          <p className="mt-1 text-text-primary">{user.email}</p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-text-secondary">Roles</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((role: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary text-text-inverse text-xs font-medium rounded-full"
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-text-secondary text-sm">
              No roles assigned
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
