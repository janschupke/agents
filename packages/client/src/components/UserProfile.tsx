import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { UserService } from '../services/user.service';
import { User } from '../types/chat.types';
import { IconClose } from './Icons';

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    setLoading(true);
    try {
      const user = await UserService.getCurrentUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-background-secondary rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  const displayUser = userInfo || {
    id: clerkUser?.id || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || null,
    firstName: clerkUser?.firstName || null,
    lastName: clerkUser?.lastName || null,
    imageUrl: clerkUser?.imageUrl || null,
    roles: [],
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-background-secondary rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-text-secondary">User Profile</h2>
        <button
          onClick={handleClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <IconClose className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          {displayUser.imageUrl ? (
            <img
              src={displayUser.imageUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-text-inverse text-3xl font-semibold border-4 border-border">
              {(displayUser.firstName || displayUser.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-text-primary">
              {displayUser.firstName || displayUser.lastName
                ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim()
                : 'User'}
            </h3>
            {displayUser.email && (
              <p className="text-text-secondary mt-1">{displayUser.email}</p>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-text-secondary">User ID</label>
            <p className="mt-1 text-text-primary font-mono text-sm break-all">
              {displayUser.id}
            </p>
          </div>

          {displayUser.firstName && (
            <div>
              <label className="text-sm font-medium text-text-secondary">First Name</label>
              <p className="mt-1 text-text-primary">{displayUser.firstName}</p>
            </div>
          )}

          {displayUser.lastName && (
            <div>
              <label className="text-sm font-medium text-text-secondary">Last Name</label>
              <p className="mt-1 text-text-primary">{displayUser.lastName}</p>
            </div>
          )}

          {displayUser.email && (
            <div>
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <p className="mt-1 text-text-primary">{displayUser.email}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-text-secondary">Roles</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {displayUser.roles && displayUser.roles.length > 0 ? (
                displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary text-text-inverse text-xs font-medium rounded-full"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-text-secondary text-sm">No roles assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={handleClose}
            className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
