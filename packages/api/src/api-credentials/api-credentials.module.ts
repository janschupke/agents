import { Module } from '@nestjs/common';
import { ApiCredentialsController } from './api-credentials.controller';
import { ApiCredentialsService } from './api-credentials.service';
import { ApiCredentialsRepository } from './repository/api-credentials.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApiCredentialsController],
  providers: [
    ApiCredentialsService,
    ApiCredentialsRepository,
    EncryptionService,
  ],
  exports: [ApiCredentialsService],
})
export class ApiCredentialsModule {}
