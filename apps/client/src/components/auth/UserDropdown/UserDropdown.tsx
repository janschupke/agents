import { useState, useRef, useEffect } from 'react';
import { useUser as useClerkUser, SignOutButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  IconUser,
  IconLogout,
  IconChevronDown,
  DropdownTransition,
} from '@openai/ui';
import { useUser } from '../../../hooks/queries/use-user';

export default function UserDropdown() {
  const { data: userInfo } = useUser();
  const { user: clerkUser } = useClerkUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
  const displayName =
    userInfo?.firstName || userInfo?.lastName
      ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
      : userInfo?.email ||
        clerkUser?.primaryEmailAddress?.emailAddress ||
        'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="User menu"
      >
        {userImage ? (
          <img
            src={userImage}
            alt="User"
            className="w-6 h-6 rounded-full border border-border"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-text-inverse text-xs font-semibold border border-border">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <IconChevronDown
          className={`w-3 h-3 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <DropdownTransition show={isOpen}>
        <div className="absolute right-0 mt-1 w-56 bg-background border border-border py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-text-primary">
              {displayName}
            </p>
            {userInfo?.email && (
              <p className="text-xs text-text-tertiary mt-0.5">
                {userInfo.email}
              </p>
            )}
          </div>
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="block w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-background-tertiary transition-colors flex items-center gap-2"
          >
            <IconUser className="w-4 h-4" />
            <span>Profile</span>
          </Link>
          <div className="border-t border-border mt-1">
            <SignOutButton>
              <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-background-tertiary transition-colors flex items-center gap-2">
                <IconLogout className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </DropdownTransition>
    </div>
  );
}
