import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LogType } from '@prisma/client';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from './constants/ai-request-log.constants';

@Injectable()
export class AiRequestLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId?: string | null;
    agentId?: number | null;
    logType: LogType;
    requestJson: Prisma.InputJsonValue;
    responseJson: Prisma.InputJsonValue;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedPrice: number;
  }) {
    return this.prisma.aiRequestLog.create({
      data: {
        ...data,
        userId: data.userId ?? null,
        agentId: data.agentId ?? null,
      },
    });
  }

  async findAll(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
    orderBy?: AiRequestLogOrderBy;
    orderDirection?: OrderDirection;
  }) {
    const where: Prisma.AiRequestLogWhereInput = {};

    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.model) {
      where.model = options.model;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const orderBy: Prisma.AiRequestLogOrderByWithRelationInput = {};
    if (options?.orderBy) {
      orderBy[options.orderBy] = options.orderDirection || OrderDirection.DESC;
    } else {
      orderBy.createdAt = OrderDirection.DESC;
    }

    return this.prisma.aiRequestLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async count(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.AiRequestLogWhereInput = {};

    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.model) {
      where.model = options.model;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return this.prisma.aiRequestLog.count({ where });
  }
}
