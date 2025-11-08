import { useState, useRef, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { User } from '../types/chat.types';

interface UserDropdownProps {
  userInfo: User | null;
  onProfileClick: () => void;
}

export default function UserDropdown({ userInfo, onProfileClick }: UserDropdownProps) {
  const { user: clerkUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const userImage = userInfo?.imageUrl || clerkUser?.imageUrl;
  const displayName = userInfo?.firstName || userInfo?.lastName
    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
    : userInfo?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="User menu"
      >
        {userImage ? (
          <img
            src={userImage}
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse font-semibold border-2 border-border">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background-secondary rounded-lg shadow-lg border border-border py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary">{displayName}</p>
            {userInfo?.email && (
              <p className="text-xs text-text-secondary mt-1">{userInfo.email}</p>
            )}
          </div>
          <button
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
          >
            Profile
          </button>
          <div className="border-t border-border mt-1">
            <SignOutButton>
              <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}
