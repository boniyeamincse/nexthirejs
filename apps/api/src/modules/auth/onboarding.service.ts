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
import { SetupCountryDto } from './dto/setup-country.dto';
import { SetupLanguageDto } from './dto/setup-language.dto';
import { SetupCareerGoalDto } from './dto/setup-career-goal.dto';

export interface OnboardingStepResult {
  step: string;
  completed: boolean;
  message: string;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async setupCountry(userId: string, dto: SetupCountryDto): Promise<OnboardingStepResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'PENDING_VERIFICATION' && user.status !== 'PROFILE_SETUP') {
      throw new BadRequestException('User must be in verification or setup state');
    }

    const country = await this.prisma.country.findUnique({
      where: { id: dto.countryId },
    });

    if (!country || !country.isActive) {
      throw new NotFoundException('Country not found or inactive');
    }

    const existing = await this.prisma.candidatePreference.findUnique({
      where: { userId },
    });

    if (existing) {
      await this.prisma.candidatePreference.update({
        where: { userId },
        data: {
          countryId: dto.countryId,
          ...(dto.currentCity && { currentCity: dto.currentCity }),
        },
      });
    } else {
      await this.prisma.candidatePreference.create({
        data: {
          userId,
          countryId: dto.countryId,
          currentCity: dto.currentCity || 'Not specified',
        },
      });
    }

    await this.auditService.recordBestEffort({
      action: 'auth.onboarding.country_setup',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { countryId: dto.countryId, countryCode: country.code },
    });

    this.logger.log(`Country setup for user ${userId}: ${country.code}`);

    return {
      step: 'country',
      completed: true,
      message: 'Country preference saved',
    };
  }

  async setupLanguages(userId: string, dto: SetupLanguageDto): Promise<OnboardingStepResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'PENDING_VERIFICATION' && user.status !== 'PROFILE_SETUP') {
      throw new BadRequestException('User must be in verification or setup state');
    }

    if (!dto.languages || dto.languages.length === 0) {
      throw new BadRequestException('At least one language is required');
    }

    // Delete existing languages for this user
    await this.prisma.candidateLanguage.deleteMany({
      where: { userId },
    });

    // Create new language entries with default proficiency
    await Promise.all(
      dto.languages.map((lang, index) =>
        this.prisma.candidateLanguage.create({
          data: {
            userId,
            name: lang,
            normalizedName: lang.toLowerCase(),
            speaking: 'CONVERSATIONAL',
            reading: 'CONVERSATIONAL',
            writing: 'CONVERSATIONAL',
            sortOrder: index,
          },
        }),
      ),
    );

    await this.auditService.recordBestEffort({
      action: 'auth.onboarding.language_setup',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { languageCount: dto.languages.length, languages: dto.languages },
    });

    this.logger.log(`Language setup for user ${userId}: ${dto.languages.join(', ')}`);

    return {
      step: 'languages',
      completed: true,
      message: `${dto.languages.length} language(s) added`,
    };
  }

  async setupCareerGoal(userId: string, dto: SetupCareerGoalDto): Promise<OnboardingStepResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'PENDING_VERIFICATION' && user.status !== 'PROFILE_SETUP') {
      throw new BadRequestException('User must be in verification or setup state');
    }

    const careerGoal = await this.prisma.careerGoal.findUnique({
      where: { id: dto.careerGoalId },
    });

    if (!careerGoal || !careerGoal.isActive) {
      throw new NotFoundException('Career goal not found or inactive');
    }

    const preference = await this.prisma.candidatePreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      throw new BadRequestException('Please set up your country before selecting a career goal');
    }

    await this.prisma.candidatePreference.update({
      where: { userId },
      data: { careerGoalId: dto.careerGoalId },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.onboarding.career_goal_setup',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { careerGoalId: dto.careerGoalId, careerGoalName: careerGoal.name },
    });

    this.logger.log(`Career goal setup for user ${userId}: ${careerGoal.name}`);

    return {
      step: 'careerGoal',
      completed: true,
      message: 'Career goal selected',
    };
  }

  async completeOnboarding(userId: string): Promise<OnboardingStepResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'PROFILE_SETUP') {
      throw new BadRequestException('User is not in profile setup state');
    }

    const preference = await this.prisma.candidatePreference.findUnique({
      where: { userId },
    });

    if (!preference || !preference.careerGoalId) {
      throw new BadRequestException('Please complete all required onboarding steps');
    }

    const languages = await this.prisma.candidateLanguage.findMany({
      where: { userId },
    });

    if (languages.length === 0) {
      throw new BadRequestException('Please select at least one language');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.onboarding.completed',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Onboarding completed for user ${userId}`);

    return {
      step: 'complete',
      completed: true,
      message: 'Onboarding completed successfully',
    };
  }

  async getCareerGoals(): Promise<any[]> {
    return this.prisma.careerGoal.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        icon: true,
      },
    });
  }
}
