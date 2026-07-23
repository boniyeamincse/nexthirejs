import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CvService, CvResponse } from './cv.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { DuplicateCvDto } from './dto/duplicate-cv.dto';

@ApiTags('CV Builder')
@Controller('cvs')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CV' })
  @ApiResponse({ status: 201, description: 'CV created successfully' })
  async createCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateCvDto,
  ): Promise<CvResponse> {
    return this.cvService.createCv(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all CVs for current user' })
  @ApiResponse({ status: 200, description: 'CVs retrieved successfully' })
  async listCvs(@CurrentUser() user: AuthenticatedPrincipal): Promise<CvResponse[]> {
    return this.cvService.listCvs(user.userId);
  }

  @Get(':cvId')
  @ApiOperation({ summary: 'Get a specific CV' })
  @ApiResponse({ status: 200, description: 'CV retrieved successfully' })
  async getCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<CvResponse> {
    return this.cvService.getCvById(user.userId, cvId);
  }

  @Put(':cvId')
  @ApiOperation({ summary: 'Update a CV' })
  @ApiResponse({ status: 200, description: 'CV updated successfully' })
  async updateCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Body() dto: UpdateCvDto,
  ): Promise<CvResponse> {
    return this.cvService.updateCv(user.userId, cvId, dto);
  }

  @Post(':cvId/set-default')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set CV as default' })
  @ApiResponse({ status: 204, description: 'CV set as default' })
  async setDefaultCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<void> {
    return this.cvService.setDefaultCv(user.userId, cvId);
  }

  @Post(':cvId/duplicate')
  @ApiOperation({ summary: 'Duplicate a CV' })
  @ApiResponse({ status: 201, description: 'CV duplicated successfully' })
  async duplicateCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Body() dto: DuplicateCvDto,
  ): Promise<CvResponse> {
    return this.cvService.duplicateCv(user.userId, cvId, dto.title);
  }

  @Delete(':cvId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a CV' })
  @ApiResponse({ status: 204, description: 'CV deleted successfully' })
  async deleteCv(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<void> {
    return this.cvService.deleteCv(user.userId, cvId);
  }
}
