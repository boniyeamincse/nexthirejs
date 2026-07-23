import { Controller, Get, Put, Delete, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminExpertsService } from '../services/admin-experts.service';

@ApiTags('SuperAdmin Experts')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({ path: 'admin/experts', version: '1' })
export class AdminExpertsController {
  constructor(private readonly expertsService: AdminExpertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all experts' })
  async getExperts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('verified') verified?: string,
    @Query('country') country?: string,
  ) {
    return this.expertsService.getExperts(parseInt(page), parseInt(limit), { search, status, verified, country });
  }

  @Get('verification/pending')
  @ApiOperation({ summary: 'Get pending expert verifications' })
  async getPendingVerifications(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.expertsService.getPendingVerifications(parseInt(page), parseInt(limit));
  }

  @Get('verification/:id')
  @ApiOperation({ summary: 'Get verification details' })
  async getVerificationDetail(@Param('id') id: string) {
    return this.expertsService.getVerificationDetail(id);
  }

  @Get('verification/:id/documents')
  @ApiOperation({ summary: 'Get verification documents' })
  async getVerificationDocuments(@Param('id') id: string) {
    return this.expertsService.getVerificationDocuments(id);
  }

  @Put('verification/:id/approve')
  @ApiOperation({ summary: 'Approve expert verification' })
  async approveVerification(@Param('id') id: string, @Body() body?: { note?: string }) {
    return this.expertsService.approveVerification(id, body?.note);
  }

  @Put('verification/:id/reject')
  @ApiOperation({ summary: 'Reject expert verification' })
  async rejectVerification(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.expertsService.rejectVerification(id, body?.reason);
  }

  @Put('verification/:id/request-changes')
  @ApiOperation({ summary: 'Request changes for verification' })
  async requestChanges(@Param('id') id: string, @Body() body?: { feedback?: string }) {
    return this.expertsService.requestChanges(id, body?.feedback);
  }

  @Get('verification/history')
  @ApiOperation({ summary: 'Get verification history' })
  async getVerificationHistory(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.expertsService.getVerificationHistory(parseInt(page), parseInt(limit));
  }

  @Put('verification/:id/reverify')
  @ApiOperation({ summary: 'Request re-verification' })
  async requestReverification(@Param('id') id: string) {
    return this.expertsService.requestReverification(id);
  }

  @Get('performance/top')
  @ApiOperation({ summary: 'Get top performing experts' })
  async getTopExperts(@Query('limit') limit = '10') {
    return this.expertsService.getTopExperts(parseInt(limit));
  }

  @Get('performance/bookings')
  @ApiOperation({ summary: 'Get booking conversion rate' })
  async getBookingPerformance() {
    return this.expertsService.getBookingPerformance();
  }

  @Get('performance/ratings')
  @ApiOperation({ summary: 'Get rating trends' })
  async getRatingTrends() {
    return this.expertsService.getRatingTrends();
  }

  @Get('performance/earnings')
  @ApiOperation({ summary: 'Get earnings leaderboard' })
  async getEarningsLeaderboard(@Query('limit') limit = '10') {
    return this.expertsService.getEarningsLeaderboard(parseInt(limit));
  }

  @Get('performance/services')
  @ApiOperation({ summary: 'Get service performance' })
  async getServicePerformance() {
    return this.expertsService.getServicePerformance();
  }

  @Get('performance/no-shows')
  @ApiOperation({ summary: 'Get no-show rates' })
  async getNoShowRates() {
    return this.expertsService.getNoShowRates();
  }

  @Get('performance/completion')
  @ApiOperation({ summary: 'Get completion rates' })
  async getCompletionRates() {
    return this.expertsService.getCompletionRates();
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Get all expert complaints' })
  async getComplaints(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.expertsService.getComplaints(parseInt(page), parseInt(limit));
  }

  @Get('complaints/:id')
  @ApiOperation({ summary: 'Get complaint details' })
  async getComplaintDetail(@Param('id') id: string) {
    return this.expertsService.getComplaintDetail(id);
  }

  @Put('complaints/:id/resolve')
  @ApiOperation({ summary: 'Resolve complaint' })
  async resolveComplaint(@Param('id') id: string, @Body() body?: { resolution?: string }) {
    return this.expertsService.resolveComplaint(id, body?.resolution);
  }

  @Put('complaints/:id/warn')
  @ApiOperation({ summary: 'Issue warning to expert' })
  async warnExpert(@Param('id') id: string) {
    return this.expertsService.warnExpert(id);
  }

  @Put('complaints/:id/suspend')
  @ApiOperation({ summary: 'Suspend expert' })
  async suspendExpert(@Param('id') id: string) {
    return this.expertsService.suspendExpert(id);
  }

  @Post('complaints/:id/notes')
  @ApiOperation({ summary: 'Add internal notes' })
  async addComplaintNote(@Param('id') id: string, @Body() body: { note: string }) {
    return this.expertsService.addComplaintNote(id, body.note);
  }

  @Get('reports/registration')
  @ApiOperation({ summary: 'Get registration trends' })
  async getRegistrationTrends() {
    return this.expertsService.getRegistrationTrends();
  }

  @Get('reports/verification')
  @ApiOperation({ summary: 'Get verification success rate' })
  async getVerificationSuccessRate() {
    return this.expertsService.getVerificationSuccessRate();
  }

  @Get('reports/bookings')
  @ApiOperation({ summary: 'Get booking analytics' })
  async getBookingAnalytics() {
    return this.expertsService.getBookingAnalytics();
  }

  @Get('reports/earnings')
  @ApiOperation({ summary: 'Get earnings analytics' })
  async getEarningsAnalytics() {
    return this.expertsService.getEarningsAnalytics();
  }

  @Get('reports/services')
  @ApiOperation({ summary: 'Get service popularity' })
  async getServicePopularity() {
    return this.expertsService.getServicePopularity();
  }

  @Get('reports/countries')
  @ApiOperation({ summary: 'Get country-wise distribution' })
  async getCountryDistribution() {
    return this.expertsService.getCountryDistribution();
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export expert reports' })
  async exportReports(@Query('format') format = 'csv') {
    return this.expertsService.exportReports(format);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expert details' })
  async getExpert(@Param('id') id: string) {
    return this.expertsService.getExpert(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get expert full profile' })
  async getExpertProfile(@Param('id') id: string) {
    return this.expertsService.getExpertProfile(id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get expert services' })
  async getExpertServices(@Param('id') id: string) {
    return this.expertsService.getExpertServices(id);
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Get expert bookings history' })
  async getExpertBookings(@Param('id') id: string) {
    return this.expertsService.getExpertBookings(id);
  }

  @Get(':id/earnings')
  @ApiOperation({ summary: 'Get expert earnings' })
  async getExpertEarnings(@Param('id') id: string) {
    return this.expertsService.getExpertEarnings(id);
  }

  @Get(':id/payouts')
  @ApiOperation({ summary: 'Get expert payouts' })
  async getExpertPayouts(@Param('id') id: string) {
    return this.expertsService.getExpertPayouts(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get expert reviews' })
  async getExpertReviews(@Param('id') id: string) {
    return this.expertsService.getExpertReviews(id);
  }

  @Get(':id/complaints')
  @ApiOperation({ summary: 'Get expert complaints' })
  async getExpertComplaintsById(@Param('id') id: string) {
    return this.expertsService.getExpertComplaintsById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update expert status' })
  async updateExpertStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }) {
    return this.expertsService.updateExpertStatus(id, body.status, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expert account' })
  async deleteExpert(@Param('id') id: string) {
    return this.expertsService.deleteExpert(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk expert operations' })
  async bulkExperts(@Body() body: { userIds: string[]; action: string }) {
    return this.expertsService.bulkExperts(body.userIds, body.action);
  }
}
