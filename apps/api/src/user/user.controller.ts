import { Controller, Get, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkService } from '../auth/clerk.service';
import { User } from '../auth/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedUser } from '../common/types/auth.types';
import { UserResponseDto, UserListResponseDto } from '../common/dto/user.dto';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

@Controller(API_ROUTES.USER.BASE)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly clerkService: ClerkService
  ) {}

  @Get('all')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAllUsers(): Promise<UserListResponseDto[]> {
    this.logger.log('Getting all users (admin only)');
    const users = await this.userService.findAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      roles: (user.roles as string[]) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  @Get('me')
  async getCurrentUser(
    @User() user: AuthenticatedUser
  ): Promise<UserResponseDto> {
    this.logger.log(`Getting current user ${user.id}`);
    // Ensure user has roles (default to ["user"] if not present)
    const roles =
      user.roles && user.roles.length > 0
        ? user.roles
        : [MAGIC_STRINGS.DEFAULT_USER_ROLE];

    // If user doesn't have roles in Clerk metadata, update Clerk
    if (!user.roles || user.roles.length === 0) {
      try {
        await this.clerkService.updateUserRoles(user.id, roles);
      } catch (error) {
        // Log but don't fail - roles will still be set in DB
        this.logger.warn(
          'Failed to update Clerk roles, continuing with DB sync:',
          error
        );
      }
    }

    // Sync user from Clerk to DB (including roles)
    // Note: User is already synced by ClerkGuard, but we ensure roles are synced
    await this.userService.syncRolesFromClerk(user.id, roles);

    // Get fresh user data with roles from DB
    const dbUser = await this.userService.findById(user.id);
    const dbRoles = (dbUser.roles as string[]) || [
      MAGIC_STRINGS.DEFAULT_USER_ROLE,
    ];

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      imageUrl: dbUser.imageUrl,
      roles: dbRoles,
    };
  }
}
