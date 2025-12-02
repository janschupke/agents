export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}
