import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpertPublicDirectoryRepository } from '../repositories/expert-public-directory.repository';
import { ExpertSlotService } from '../availability/expert-slot.service';
import {
  publicExpertListQuerySchema,
  publicExpertSlugParamSchema,
  publicExpertServiceSlotQuerySchema,
} from '@nexthire/validation';
import { EXPERT_ERROR_CODES, EXPERT_BOOKING_ERROR_CODES } from '@nexthire/constants';
import type {
  ExpertAvailabilitySlotPreviewResult,
  ExpertExpertiseLevel,
  ExpertServiceType,
  PaginatedPublicExpertResult,
  PublicExpertListQuery,
  PublicExpertProfileDetail,
} from '@nexthire/types';

interface ExpertiseAreaRef {
  name: string;
  slug: string;
}

interface DirectoryListRow {
  expertProfile: {
    publicSlug: string | null;
    professionalTitle: string;
    professionalSummary: string;
    yearsOfExperience: number;
    currentCompany: string | null;
    currentPosition: string | null;
    countryId: string;
    city: string | null;
    interviewLanguages: unknown;
  } | null;
  expertExpertise: { expertiseArea: ExpertiseAreaRef }[];
}

interface DirectoryDetailUser {
  expertExpertise: {
    expertiseArea: ExpertiseAreaRef;
    level: ExpertExpertiseLevel;
    isPrimary: boolean;
  }[];
  expertServices: {
    id: string;
    type: ExpertServiceType;
    title: string;
    shortDescription: string;
    durationMinutes: number;
    priceAmount: { toString(): string };
    priceCurrency: string;
  }[];
}

@Injectable()
export class ExpertPublicDirectoryService {
  constructor(
    private readonly repository: ExpertPublicDirectoryRepository,
    private readonly slotService: ExpertSlotService,
  ) {}

  async list(query: unknown): Promise<PaginatedPublicExpertResult> {
    const parsed = publicExpertListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const q = parsed.data as Required<Pick<PublicExpertListQuery, 'page' | 'pageSize'>> &
      PublicExpertListQuery;
    const { total, rows } = await this.repository.listPublic(q);

    return {
      data: (rows as unknown as DirectoryListRow[]).map((row) => {
        const profile = row.expertProfile!;
        return {
          publicSlug: profile.publicSlug!,
          professionalTitle: profile.professionalTitle,
          professionalSummary: profile.professionalSummary,
          yearsOfExperience: profile.yearsOfExperience,
          currentCompany: profile.currentCompany,
          currentPosition: profile.currentPosition,
          countryId: profile.countryId,
          city: profile.city,
          interviewLanguages: (profile.interviewLanguages as string[]) ?? [],
          primaryExpertise: row.expertExpertise.map((e) => ({
            areaName: e.expertiseArea.name,
            areaSlug: e.expertiseArea.slug,
          })),
        };
      }),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  async getBySlug(rawSlug: string): Promise<PublicExpertProfileDetail> {
    const parsedSlug = publicExpertSlugParamSchema.safeParse(rawSlug);
    if (!parsedSlug.success) {
      throw new NotFoundException(EXPERT_ERROR_CODES.PUBLIC_PROFILE_NOT_FOUND);
    }

    const found = await this.repository.findPublicBySlug(parsedSlug.data);
    if (!found) {
      throw new NotFoundException(EXPERT_ERROR_CODES.PUBLIC_PROFILE_NOT_FOUND);
    }
    const { profile, user } = found;
    const u = user as unknown as DirectoryDetailUser;

    return {
      publicSlug: profile.publicSlug!,
      professionalTitle: profile.professionalTitle,
      professionalSummary: profile.professionalSummary,
      yearsOfExperience: profile.yearsOfExperience,
      currentCompany: profile.currentCompany,
      currentPosition: profile.currentPosition,
      highestEducation: profile.highestEducation,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
      personalWebsiteUrl: profile.personalWebsiteUrl,
      interviewLanguages: (profile.interviewLanguages as string[]) ?? [],
      countryId: profile.countryId,
      city: profile.city,
      expertise: u.expertExpertise.map((e) => ({
        areaName: e.expertiseArea.name,
        areaSlug: e.expertiseArea.slug,
        level: e.level,
        isPrimary: e.isPrimary,
      })),
      services: u.expertServices.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        shortDescription: s.shortDescription,
        durationMinutes: s.durationMinutes,
        price: { amount: s.priceAmount.toString(), currency: s.priceCurrency },
      })),
    };
  }

  async getServiceSlots(
    rawSlug: string,
    serviceId: string,
    query: unknown,
  ): Promise<ExpertAvailabilitySlotPreviewResult> {
    const parsedSlug = publicExpertSlugParamSchema.safeParse(rawSlug);
    if (!parsedSlug.success) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.SERVICE_NOT_BOOKABLE);
    }

    const parsedQuery = publicExpertServiceSlotQuerySchema.safeParse(query ?? {});
    if (!parsedQuery.success) {
      throw new BadRequestException({
        code: EXPERT_BOOKING_ERROR_CODES.VALIDATION_FAILED,
        details: parsedQuery.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const found = await this.repository.findPublicServiceBySlug(parsedSlug.data, serviceId);
    if (!found) {
      throw new NotFoundException(EXPERT_BOOKING_ERROR_CODES.SERVICE_NOT_BOOKABLE);
    }

    return this.slotService.previewSlots(found.expertUserId, {
      from: parsedQuery.data.from,
      to: parsedQuery.data.to,
      durationMinutes: found.service.durationMinutes,
    });
  }
}
