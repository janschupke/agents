import { Module } from '@nestjs/common';
import { AiRequestLogController } from './ai-request-log.controller';
import { AiRequestLogService } from './ai-request-log.service';
import { AiRequestLogRepository } from './ai-request-log.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiRequestLogController],
  providers: [AiRequestLogService, AiRequestLogRepository],
  exports: [AiRequestLogService],
})
export class AiRequestLogModule {}
