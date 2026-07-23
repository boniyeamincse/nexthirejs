import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProjectService, ProjectResponse } from './project.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { CreateProjectDto } from './dto/create-project.dto';

export class AddTechnologyDto {
  name!: string;
  category!: string;
}

export class AddMediaDto {
  type!: string;
  url!: string;
  caption?: string;
}

@ApiTags('Projects')
@Controller('projects')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async createProject(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectService.createProject(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved' })
  async listProjects(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ): Promise<ProjectResponse[]> {
    return this.projectService.listProjects(user.userId, { status, visibility });
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project details' })
  @ApiResponse({ status: 200, description: 'Project retrieved' })
  async getProject(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
  ): Promise<any> {
    return this.projectService.getProjectById(user.userId, projectId);
  }

  @Put(':projectId')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async updateProject(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
    @Body() dto: Partial<CreateProjectDto>,
  ): Promise<ProjectResponse> {
    return this.projectService.updateProject(user.userId, projectId, dto);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  async deleteProject(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    return this.projectService.deleteProject(user.userId, projectId);
  }

  @Post(':projectId/technologies')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add technology to project' })
  @ApiResponse({ status: 204, description: 'Technology added' })
  async addTechnology(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
    @Body() dto: AddTechnologyDto,
  ): Promise<void> {
    return this.projectService.addTechnology(user.userId, projectId, dto.name, dto.category);
  }

  @Delete(':projectId/technologies/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove technology from project' })
  @ApiResponse({ status: 204, description: 'Technology removed' })
  async removeTechnology(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
    @Param('name') name: string,
  ): Promise<void> {
    return this.projectService.removeTechnology(user.userId, projectId, name);
  }

  @Post(':projectId/media')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add media to project' })
  @ApiResponse({ status: 204, description: 'Media added' })
  async addMedia(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('projectId') projectId: string,
    @Body() dto: AddMediaDto,
  ): Promise<void> {
    return this.projectService.addMedia(user.userId, projectId, dto.type, dto.url, dto.caption);
  }
}
