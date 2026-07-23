import { Controller, Get, Put, Delete, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminCandidatesService } from '../services/admin-candidates.service';

@ApiTags('SuperAdmin Candidates')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({ path: 'admin/candidates', version: '1' })
export class AdminCandidatesController {
  constructor(private readonly candidatesService: AdminCandidatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  async getCandidates(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('country') country?: string,
    @Query('skill') skill?: string,
  ) {
    return this.candidatesService.getCandidates({ page: parseInt(page), limit: parseInt(limit), search, status, country, skill });
  }

  @Get('skills/pending')
  @ApiOperation({ summary: 'Get pending skill verifications' })
  async getPendingSkillVerifications(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.candidatesService.getPendingSkillVerifications(parseInt(page), parseInt(limit));
  }

  @Put('skills/:id/verify')
  @ApiOperation({ summary: 'Verify candidate skill' })
  async verifySkill(@Param('id') id: string) {
    return this.candidatesService.verifySkill(id);
  }

  @Put('skills/:id/reject')
  @ApiOperation({ summary: 'Reject skill verification' })
  async rejectSkill(@Param('id') id: string) {
    return this.candidatesService.rejectSkill(id);
  }

  @Get('skills/verified')
  @ApiOperation({ summary: 'Get verified skills summary' })
  async getVerifiedSkills() {
    return this.candidatesService.getVerifiedSkills();
  }

  @Get('skills/history')
  @ApiOperation({ summary: 'Get verification history' })
  async getSkillVerificationHistory(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.candidatesService.getSkillVerificationHistory(parseInt(page), parseInt(limit));
  }

  @Get('readiness/distribution')
  @ApiOperation({ summary: 'Get readiness level distribution' })
  async getReadinessDistribution() {
    return this.candidatesService.getReadinessDistribution();
  }

  @Get('readiness/progress')
  @ApiOperation({ summary: 'Get career progress tracking' })
  async getReadinessProgress() {
    return this.candidatesService.getReadinessProgress();
  }

  @Get('readiness/gaps')
  @ApiOperation({ summary: 'Get skill gap analysis' })
  async getSkillGaps() {
    return this.candidatesService.getSkillGaps();
  }

  @Get('readiness/reports')
  @ApiOperation({ summary: 'Get job readiness reports' })
  async getReadinessReports() {
    return this.candidatesService.getReadinessReports();
  }

  @Get('reports/registration')
  @ApiOperation({ summary: 'Get registration trends' })
  async getRegistrationTrends() {
    return this.candidatesService.getRegistrationTrends();
  }

  @Get('reports/completion')
  @ApiOperation({ summary: 'Get profile completion analytics' })
  async getProfileCompletion() {
    return this.candidatesService.getProfileCompletion();
  }

  @Get('reports/readiness')
  @ApiOperation({ summary: 'Get readiness improvement' })
  async getReadinessImprovement() {
    return this.candidatesService.getReadinessImprovement();
  }

  @Get('reports/countries')
  @ApiOperation({ summary: 'Get country-wise distribution' })
  async getCountryDistribution() {
    return this.candidatesService.getCountryDistribution();
  }

  @Get('reports/skills')
  @ApiOperation({ summary: 'Get skill distribution' })
  async getSkillDistribution() {
    return this.candidatesService.getSkillDistribution();
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export candidate reports' })
  async exportReports(@Query('format') format = 'csv') {
    return this.candidatesService.exportReports(format);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate details' })
  async getCandidate(@Param('id') id: string) {
    return this.candidatesService.getCandidate(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get candidate full profile' })
  async getCandidateProfile(@Param('id') id: string) {
    return this.candidatesService.getCandidateProfile(id);
  }

  @Get(':id/passport')
  @ApiOperation({ summary: 'Get candidate career passport' })
  async getCandidatePassport(@Param('id') id: string) {
    return this.candidatesService.getCandidatePassport(id);
  }

  @Get(':id/cvs')
  @ApiOperation({ summary: 'Get candidate CV history' })
  async getCandidateCVs(@Param('id') id: string) {
    return this.candidatesService.getCandidateCVs(id);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'Get candidate projects' })
  async getCandidateProjects(@Param('id') id: string) {
    return this.candidatesService.getCandidateProjects(id);
  }

  @Get(':id/assessments')
  @ApiOperation({ summary: 'Get candidate assessment results' })
  async getCandidateAssessments(@Param('id') id: string) {
    return this.candidatesService.getCandidateAssessments(id);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get candidate session history' })
  async getCandidateSessions(@Param('id') id: string) {
    return this.candidatesService.getCandidateSessions(id);
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Get candidate job applications' })
  async getCandidateApplications(@Param('id') id: string) {
    return this.candidatesService.getCandidateApplications(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get candidate activity timeline' })
  async getCandidateActivity(@Param('id') id: string) {
    return this.candidatesService.getCandidateActivity(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update candidate status' })
  async updateCandidateStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }) {
    return this.candidatesService.updateCandidateStatus(id, body.status, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete candidate account' })
  async deleteCandidate(@Param('id') id: string) {
    return this.candidatesService.deleteCandidate(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk candidate operations' })
  async bulkCandidates(@Body() body: { userIds: string[]; action: string }) {
    return this.candidatesService.bulkCandidates(body.userIds, body.action);
  }
}
