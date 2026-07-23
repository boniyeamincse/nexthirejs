import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface CreateTrainerProfileDto {
  headline: string;
  bio?: string;
}

export interface TrainerProfileResponse {
  id: string;
  userId: string;
  headline: string;
  verificationStatus: string;
  averageRating: number;
  totalSessions: number;
  createdAt: string;
}

@Injectable()
export class TrainerService {
  private readonly logger = new Logger(TrainerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTrainerProfile(
    userId: string,
    dto: CreateTrainerProfileDto,
  ): Promise<TrainerProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, candidateProfile: { select: { fullName: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.trainerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Trainer profile already exists');
    }

    const profile = await this.prisma.trainerProfile.create({
      data: {
        userId,
        headline: dto.headline,
        bio: dto.bio,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.profile_created',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'trainer_profile',
      targetId: profile.id,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Trainer profile created for user ${userId}`);

    return this.formatTrainerResponse(profile);
  }

  async getTrainerProfile(userId: string): Promise<any> {
    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId },
      include: {
        services: true,
        packages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Trainer profile not found');
    }

    return profile;
  }

  async updateTrainerProfile(
    userId: string,
    dto: Partial<CreateTrainerProfileDto>,
  ): Promise<TrainerProfileResponse> {
    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException('Trainer profile not found');
    }

    if (profile.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const updated = await this.prisma.trainerProfile.update({
      where: { userId },
      data: {
        ...(dto.headline && { headline: dto.headline }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.profile_updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'trainer_profile',
      targetId: updated.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.formatTrainerResponse(updated);
  }

  async createService(
    trainerId: string,
    name: string,
    category: string,
    basePrice: number,
    description?: string,
  ): Promise<void> {
    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Trainer profile not found');
    }

    await this.prisma.trainerService.create({
      data: {
        trainerId: profile.id,
        name,
        category,
        basePrice,
        description,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'trainer.service_created',
      actorType: AuditActorType.USER,
      actorUserId: trainerId,
      targetType: 'trainer_service',
      targetId: `${profile.id}:${name}`,
      outcome: AuditOutcome.SUCCESS,
      metadata: { category, basePrice },
    });

    this.logger.log(`Service ${name} created for trainer ${trainerId}`);
  }

  private formatTrainerResponse(profile: any): TrainerProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      headline: profile.headline,
      verificationStatus: profile.verificationStatus,
      averageRating: profile.averageRating?.toNumber() || 0,
      totalSessions: profile.totalSessions,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
