import {
  Controller,
  Get,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkService } from '../auth/clerk.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    roles?: string[];
  };
}

@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly clerkService: ClerkService,
  ) {}

  @Get('me')
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      // Ensure user has roles (default to ["user"] if not present)
      const roles = req.user.roles && req.user.roles.length > 0 
        ? req.user.roles 
        : ['user'];

      // If user doesn't have roles in Clerk metadata, update Clerk
      if (!req.user.roles || req.user.roles.length === 0) {
        try {
          await this.clerkService.updateUserRoles(req.user.id, roles);
        } catch (error) {
          // Log but don't fail - roles will still be set in DB
          console.warn('Failed to update Clerk roles, continuing with DB sync:', error);
        }
      }

      // Sync user from Clerk to DB (including roles)
      const user = await this.userService.findOrCreate({
        id: req.user.id,
        email: req.user.email || undefined,
        firstName: req.user.firstName || undefined,
        lastName: req.user.lastName || undefined,
        imageUrl: req.user.imageUrl || undefined,
        roles,
      });

      // Sync roles from Clerk to DB
      await this.userService.syncRolesFromClerk(req.user.id, roles);

      // Get fresh user data with roles from DB
      const dbUser = await this.userService.findById(req.user.id);
      const dbRoles = (dbUser.roles as any) || ['user'];

      return {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        imageUrl: dbUser.imageUrl,
        roles: dbRoles,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
