import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserApiCredential } from '@prisma/client';

@Injectable()
export class ApiCredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<UserApiCredential | null> {
    return this.prisma.userApiCredential.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<UserApiCredential[]> {
    return this.prisma.userApiCredential.findMany({
      where: { userId },
    });
  }

  async create(
    userId: string,
    provider: string,
    encryptedKey: string,
  ): Promise<UserApiCredential> {
    return this.prisma.userApiCredential.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        encryptedKey,
        lastUsedAt: null, // Reset lastUsedAt when updating
      },
      create: {
        userId,
        provider,
        encryptedKey,
      },
    });
  }

  async updateLastUsedAt(
    userId: string,
    provider: string,
  ): Promise<UserApiCredential> {
    return this.prisma.userApiCredential.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  async delete(userId: string, provider: string): Promise<void> {
    await this.prisma.userApiCredential.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  async hasCredential(userId: string, provider: string): Promise<boolean> {
    const credential = await this.findByUserIdAndProvider(userId, provider);
    return credential !== null;
  }
}
