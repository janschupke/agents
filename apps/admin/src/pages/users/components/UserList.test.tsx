import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserList from './UserList';
import type { User } from '../../../types/user.types';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@openai/utils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <TestQueryProvider>{children}</TestQueryProvider>
  </BrowserRouter>
);

describe('UserList', () => {
  const mockUsers: User[] = [
    {
      id: 'user_1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      imageUrl: null,
      roles: ['admin'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'user_2',
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      imageUrl: null,
      roles: ['user'],
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user list with users', () => {
    render(<UserList users={mockUsers} loading={false} />, { wrapper });

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<UserList users={[]} loading={true} />, { wrapper });

    // Table component should handle loading state
    // This test verifies the component accepts loading prop
    // When loading, the empty message might not be shown
    expect(screen.queryByText('users.empty')).not.toBeInTheDocument();
  });

  it('should render empty state when no users', () => {
    render(<UserList users={[]} loading={false} />, { wrapper });

    expect(screen.getByText('users.empty')).toBeInTheDocument();
  });

  it('should render user roles as badges', () => {
    render(<UserList users={mockUsers} loading={false} />, { wrapper });

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<UserList users={mockUsers} loading={false} onDelete={onDelete} />, {
      wrapper,
    });

    // Find delete buttons (there should be 2, one for each user)
    const deleteButtons = screen.getAllByRole('button', {
      name: 'users.delete',
    });

    expect(deleteButtons).toHaveLength(2);

    // Click first delete button
    deleteButtons[0].click();

    expect(onDelete).toHaveBeenCalledWith('user_1');
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(<UserList users={mockUsers} loading={false} />, { wrapper });

    const deleteButtons = screen.queryAllByRole('button', {
      name: 'users.delete',
    });

    expect(deleteButtons).toHaveLength(0);
  });

  it('should render user with missing name fields', () => {
    const userWithoutName: User = {
      id: 'user_3',
      email: 'noname@example.com',
      firstName: null,
      lastName: null,
      imageUrl: null,
      roles: ['user'],
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    };

    render(<UserList users={[userWithoutName]} loading={false} />, { wrapper });

    expect(screen.getByText('noname@example.com')).toBeInTheDocument();
  });

  it('should render user with no roles', () => {
    const userWithoutRoles: User = {
      id: 'user_4',
      email: 'noroles@example.com',
      firstName: 'No',
      lastName: 'Roles',
      imageUrl: null,
      roles: [],
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z',
    };

    render(<UserList users={[userWithoutRoles]} loading={false} />, {
      wrapper,
    });

    expect(screen.getByText('users.noRoles')).toBeInTheDocument();
  });
});
