import { Module } from '@nestjs/common';
import { ClerkGuard } from './clerk.guard';
import { ClerkService } from './clerk.service';

@Module({
  providers: [ClerkGuard, ClerkService],
  exports: [ClerkGuard, ClerkService],
})
export class AuthModule {}
