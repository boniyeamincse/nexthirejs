import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CompanyVerifiedAccessService } from '../services/company-verified-access.service';
import { CandidateSearchService } from '../../candidates/search/candidate-search.service';
import { CandidateProfilePreviewService } from '../../candidates/profile-preview/candidate-profile-preview.service';
import { CvService } from '../../cv/cv.service';
import { COMPANY_ERROR_CODES, COMPANY_RATE_LIMITS } from '@nexthire/constants';
import { companyCandidateSearchQuerySchema } from '@nexthire/validation';
import type { CompanyCandidateDetail } from '@nexthire/types';

const HOUR_MS = 3_600_000;

@ApiTags('Company Candidate Search')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies/me/candidates', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CompanyCandidateSearchController {
  constructor(
    private readonly verifiedAccessService: CompanyVerifiedAccessService,
    private readonly searchService: CandidateSearchService,
    private readonly profilePreviewService: CandidateProfilePreviewService,
    private readonly cvService: CvService,
  ) {}

  @Get()
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.CANDIDATE_SEARCH_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Search platform-discoverable candidates (verified companies only)' })
  async search(@Req() req: AuthenticatedRequest, @Query() query: unknown) {
    await this.verifiedAccessService.requireVerifiedMember(req.principal.userId);

    const parsed = companyCandidateSearchQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    return this.searchService.search(parsed.data);
  }

  @Get(':candidateId')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.CANDIDATE_SEARCH_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'View a discoverable candidate profile and their public CVs' })
  async detail(
    @Req() req: AuthenticatedRequest,
    @Param('candidateId') candidateId: string,
  ): Promise<CompanyCandidateDetail> {
    await this.verifiedAccessService.requireVerifiedMember(req.principal.userId);

    const profile = await this.profilePreviewService.getProfileForVerifiedCompany(
      req.principal.userId,
      candidateId,
    );
    if (!profile) {
      throw new NotFoundException({ code: COMPANY_ERROR_CODES.CANDIDATE_NOT_DISCOVERABLE });
    }

    const publicCvs = await this.cvService.listPublicCvsForCandidate(candidateId);

    return {
      profile,
      publicCvs: publicCvs.map((cv) => ({
        id: cv.id,
        title: cv.title,
        template: cv.template,
        completionScore: cv.completionScore,
        updatedAt: cv.updatedAt,
      })),
    };
  }
}
