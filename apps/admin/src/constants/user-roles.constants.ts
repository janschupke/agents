/**
 * User role constants for admin app
 * These are the available roles that can be assigned to users
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Array of all available user roles
 */
export const ALL_USER_ROLES: UserRole[] = [USER_ROLES.ADMIN, USER_ROLES.USER];
