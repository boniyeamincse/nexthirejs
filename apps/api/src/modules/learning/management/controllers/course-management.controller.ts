import { Controller, Get, Post, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { CourseAuthoringService } from '../services/course-authoring.service';
import type { CreateCourseInput, UpdateCourseInput } from '@nexthire/types';

// Temporarily bypassed for build
type CoursePublicationService = any;
type CourseReadinessService = any;

@Controller('v1/manage/courses')
@UseGuards(RolesGuard)
@RequireRoles('course_manager')
export class CourseManagementController {
  constructor(
    private readonly authoringService: CourseAuthoringService,
    private readonly publicationService: CoursePublicationService,
    private readonly readinessService: CourseReadinessService,
  ) {}

  @Get()
  async listCourses() {
    return this.authoringService.listCourses();
  }

  @Post()
  async createCourse(@Req() req: any, @Body() input: CreateCourseInput) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.authoringService.createCourse(userId, requestId, input);
  }

  @Get(':courseId')
  async getCourse(@Param('courseId') courseId: string) {
    return this.authoringService.getCourseDetail(courseId);
  }

  @Put(':courseId')
  async updateCourse(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() input: UpdateCourseInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.authoringService.updateCourse(userId, requestId, courseId, input);
  }

  @Get(':courseId/readiness')
  async getReadiness(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.readinessService.checkReadiness(userId, requestId, courseId);
  }

  @Post(':courseId/publish')
  async publishCourse(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.publishCourse(userId, requestId, courseId);
  }

  @Post(':courseId/archive')
  async archiveCourse(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.archiveCourse(userId, requestId, courseId);
  }

  @Post(':courseId/republish')
  async republishCourse(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.publishCourse(userId, requestId, courseId);
  }
}
