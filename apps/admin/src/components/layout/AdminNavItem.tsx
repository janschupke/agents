import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface AdminNavItemProps {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
  isActive?: (path: string) => boolean;
}

export default function AdminNavItem({
  to,
  icon,
  children,
  isActive,
}: AdminNavItemProps) {
  const location = useLocation();
  const active = isActive ? isActive(to) : location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
        active
          ? 'text-primary border-b-2 border-primary'
          : 'text-text-tertiary hover:text-text-secondary'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
