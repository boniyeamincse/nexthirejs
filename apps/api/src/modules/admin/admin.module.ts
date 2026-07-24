import { Module } from '@nestjs/common';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminRolesController } from './controllers/admin-roles.controller';
import { AdminCandidatesController } from './controllers/admin-candidates.controller';
import { AdminExpertsController } from './controllers/admin-experts.controller';
import { AdminLogsController } from './controllers/admin-logs.controller';
import { AdminMaintenanceController } from './controllers/admin-maintenance.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminSecurityController } from './controllers/admin-security.controller';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminRolesService } from './services/admin-roles.service';
import { AdminCandidatesService } from './services/admin-candidates.service';
import { AdminExpertsService } from './services/admin-experts.service';
import { AdminLogsService } from './services/admin-logs.service';
import { AdminMaintenanceService } from './services/admin-maintenance.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminSecurityService } from './services/admin-security.service';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AdminDashboardController,
    AdminAnalyticsController,
    AdminUsersController,
    AdminRolesController,
    AdminCandidatesController,
    AdminExpertsController,
    AdminLogsController,
    AdminMaintenanceController,
    AdminSecurityController,
    AdminSettingsController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminRolesService,
    AdminCandidatesService,
    AdminExpertsService,
    AdminLogsService,
    AdminMaintenanceService,
    AdminSecurityService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
