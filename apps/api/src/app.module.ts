import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { ChatModule } from './chat/chat.module';
import { AgentModule } from './agent/agent.module';
import { AgentArchetypeModule } from './agent-archetype/agent-archetype.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { ApiCredentialsModule } from './api-credentials/api-credentials.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { MessageTranslationModule } from './message-translation/message-translation.module';
import { AgentMemoryModule } from './memory/agent-memory.module';
import { SessionModule } from './session/session.module';
import { SavedWordModule } from './saved-word/saved-word.module';
import { AiRequestLogModule } from './ai-request-log/ai-request-log.module';
import { AdminModule } from './admin/admin.module';
import { ClerkGuard } from './auth/clerk.guard';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    HealthcheckModule,
    ChatModule,
    AgentModule,
    AgentArchetypeModule,
    AuthModule,
    UserModule,
    WebhookModule,
    ApiCredentialsModule,
    SystemConfigModule,
    MessageTranslationModule,
    AgentMemoryModule,
    SessionModule,
    SavedWordModule,
    AiRequestLogModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
  ],
})
export class AppModule {}
