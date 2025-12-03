import { Module, forwardRef } from '@nestjs/common';
import { ClerkGuard } from './clerk.guard';
import { ClerkService } from './clerk.service';
import { RolesGuard } from './roles.guard';
import { AuthCacheService } from './services/auth-cache.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [ClerkGuard, ClerkService, RolesGuard, AuthCacheService],
  exports: [ClerkGuard, ClerkService, RolesGuard, AuthCacheService],
})
export class AuthModule {}
