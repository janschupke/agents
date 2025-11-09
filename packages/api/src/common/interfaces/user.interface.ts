export interface UserData {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  roles: string[];
}

export interface UserResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
