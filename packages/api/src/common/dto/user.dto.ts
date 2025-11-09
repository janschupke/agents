export class UserResponseDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserListResponseDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
