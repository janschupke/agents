import { Module } from '@nestjs/common';
import { AgentArchetypeController } from './agent-archetype.controller';
import { AgentArchetypeService } from './agent-archetype.service';
import { AgentArchetypeRepository } from './agent-archetype.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AgentArchetypeController],
  providers: [AgentArchetypeService, AgentArchetypeRepository],
  exports: [AgentArchetypeService],
})
export class AgentArchetypeModule {}
