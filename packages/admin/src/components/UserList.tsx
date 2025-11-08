import { User } from '../types/user.types';

interface UserListProps {
  users: User[];
  loading: boolean;
}

export default function UserList({ users, loading }: UserListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading users...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">No users found</div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-background-tertiary transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || user.email || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse font-semibold">
                        {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'User'}
                      </div>
                      <div className="text-xs text-text-tertiary font-mono">
                        {user.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary">{user.email || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            role === 'admin'
                              ? 'bg-primary text-text-inverse'
                              : 'bg-background-tertiary text-text-secondary'
                          }`}
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-tertiary">No roles</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
