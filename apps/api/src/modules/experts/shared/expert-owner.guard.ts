import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';

export const EXPERT_OWNER_CHECK_KEY = 'expertOwnerCheck';

export interface ExpertOwnerCheckMetadata {
  model: string;
  idParam?: string;
  userIdField?: string;
}

export const OwnerCheck = (model: string, idParam = 'id', userIdField = 'userId') =>
  SetMetadata(EXPERT_OWNER_CHECK_KEY, { model, idParam, userIdField } as ExpertOwnerCheckMetadata);

@Injectable()
export class ExpertOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<ExpertOwnerCheckMetadata>(
      EXPERT_OWNER_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.principal?.userId;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const id = request.params[metadata.idParam ?? 'id'];

    if (!id) {
      throw new NotFoundException('Resource identifier missing');
    }

    const prismaModel = (this.prisma as Record<string, unknown>)[metadata.model];

    if (!prismaModel || typeof prismaModel !== 'object') {
      throw new ForbiddenException('Access denied');
    }

    const findUnique = (prismaModel as Record<string, unknown>).findUnique as
      ((args: { where: { id: string } }) => Promise<Record<string, unknown> | null>) | undefined;

    if (!findUnique) {
      throw new ForbiddenException('Access denied');
    }

    const record = await findUnique({ where: { id } });

    if (!record) {
      throw new NotFoundException('Resource not found');
    }

    const userIdField = metadata.userIdField ?? 'userId';
    const recordUserId = record[userIdField] as string | undefined;

    if (!recordUserId || recordUserId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
