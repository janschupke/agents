import { Module, forwardRef } from '@nestjs/common';
import { ClerkGuard } from './clerk.guard';
import { ClerkService } from './clerk.service';
import { RolesGuard } from './roles.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [ClerkGuard, ClerkService, RolesGuard],
  exports: [ClerkGuard, ClerkService, RolesGuard],
})
export class AuthModule {}
