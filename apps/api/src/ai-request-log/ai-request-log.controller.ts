import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import { AiRequestLogService } from './ai-request-log.service';
import { GetAiRequestLogsQueryDto } from './dto/ai-request-log.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants';

@Controller(API_ROUTES.AI_REQUEST_LOGS.BASE)
@UseGuards(RolesGuard)
@Roles('admin')
export class AiRequestLogController {
  private readonly logger = new Logger(AiRequestLogController.name);

  constructor(private readonly aiRequestLogService: AiRequestLogService) {}

  @Get()
  async getAllLogs(@Query() query: GetAiRequestLogsQueryDto) {
    this.logger.log('Getting AI request logs');

    const options = {
      userId: query.userId,
      model: query.model,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      pageSize: query.pageSize,
      orderBy: query.orderBy,
      orderDirection: query.orderDirection,
    };

    return this.aiRequestLogService.getAllLogs(options);
  }
}
