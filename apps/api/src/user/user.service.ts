import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findOrCreate(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    roles?: string[];
  }) {
    return this.userRepository.create(userData);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      roles?: string[];
    }
  ) {
    return this.userRepository.update(id, data);
  }

  async syncRolesFromClerk(
    id: string,
    clerkRoles: string[] | null | undefined
  ): Promise<User> {
    // If no roles in Clerk, default to ["user"]
    const roles = clerkRoles && clerkRoles.length > 0 ? clerkRoles : ['user'];
    return this.userRepository.updateRoles(id, roles);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
