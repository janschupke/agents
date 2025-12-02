export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}
