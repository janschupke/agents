import { Module } from '@nestjs/common';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { SystemConfigRepository } from './system-config.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService, SystemConfigRepository],
  exports: [SystemConfigService, SystemConfigRepository],
})
export class SystemConfigModule {}
