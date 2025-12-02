import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionWithAgentResponseDto } from '../common/dto/chat.dto';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.SESSIONS.BASE)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get(':sessionId')
  async getSessionWithAgent(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionWithAgentResponseDto> {
    return await this.sessionService.getSessionWithAgent(sessionId, user.id);
  }
}
