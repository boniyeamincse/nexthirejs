import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { CourseModuleService } from '../services/course-module.service';
import type {
  CreateCourseModuleInput,
  UpdateCourseModuleInput,
  ReorderCourseModulesInput,
} from '@nexthire/types';

@Controller('v1/manage/courses/:courseId/modules')
@UseGuards(RolesGuard)
@RequireRoles('course_manager')
export class CourseModuleManagementController {
  constructor(private readonly moduleService: CourseModuleService) {}

  @Post()
  async createModule(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() input: CreateCourseModuleInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.moduleService.createModule(userId, requestId, courseId, input);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderModules(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() input: ReorderCourseModulesInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.moduleService.reorderModules(userId, requestId, courseId, input.orderedIds);
  }

  @Put(':moduleId')
  async updateModule(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() input: UpdateCourseModuleInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.moduleService.updateModule(userId, requestId, courseId, moduleId, input);
  }

  @Delete(':moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteModule(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.moduleService.deleteModule(userId, requestId, courseId, moduleId);
  }
}
