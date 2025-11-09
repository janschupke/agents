import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    roles?: string[];
  }): Promise<User> {
    const perfStart = Date.now();
    // Use a single upsert that includes roles to avoid separate update
    const roles = data.roles && data.roles.length > 0 ? (data.roles as any) : [];
    const result = await this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
        roles: roles,
      },
      create: {
        id: data.id,
        email: data.email || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        imageUrl: data.imageUrl || null,
        roles: roles,
      },
    });
    const perfTime = Date.now() - perfStart;
    if (perfTime > 100) {
      console.log(`[Performance] UserRepository.create (upsert) took ${perfTime}ms for user ${data.id}`);
    }
    return result;
  }

  async update(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      roles?: string[];
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
        roles: data.roles ? (data.roles as any) : undefined,
      },
    });
  }

  async updateRoles(id: string, roles: string[]): Promise<User> {
    const perfStart = Date.now();
    const result = await this.prisma.user.update({
      where: { id },
      data: {
        roles: roles as any,
      },
    });
    const perfTime = Date.now() - perfStart;
    if (perfTime > 100) {
      console.log(`[Performance] UserRepository.updateRoles took ${perfTime}ms for user ${id}`);
    }
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
