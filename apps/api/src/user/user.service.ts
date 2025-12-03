import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async findOrCreate(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    roles?: string[];
  }) {
    this.logger.debug(`Finding or creating user ${userData.id}`);
    return this.userRepository.create(userData);
  }

  async findById(id: string) {
    this.logger.debug(`Finding user ${id}`);
    const user = await this.userRepository.findById(id);
    if (!user) {
      this.logger.warn(`User ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
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
    this.logger.log(`Updating user ${id}`);
    return this.userRepository.update(id, data);
  }

  async syncRolesFromClerk(
    id: string,
    clerkRoles: string[] | null | undefined
  ): Promise<User> {
    this.logger.debug(`Syncing roles for user ${id} from Clerk`);
    // If no roles in Clerk, default to ["user"]
    const roles = clerkRoles && clerkRoles.length > 0 ? clerkRoles : ['user'];
    return this.userRepository.updateRoles(id, roles);
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('Finding all users');
    return this.userRepository.findAll();
  }
}
