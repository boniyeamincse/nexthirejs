import { Controller, Post, Get, Body, HttpCode, Res, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { Public } from './decorators/public.decorator';
import { AllowRevokedSession } from './decorators/allow-revoked-session.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { LoginService } from './login.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import type {
  CandidateLoginResult,
  RefreshSessionResult,
  AuthenticatedUser,
} from '@nexthire/types';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { AUTH_ERROR_CODES } from '@nexthire/constants';

const REFRESH_COOKIE_NAME = 'nexthire_refresh';

@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified or account unavailable' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<CandidateLoginResult> {
    const ip = req.ip || req.socket?.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;
    const result = await this.loginService.login(dto.email, dto.password, {
      ipAddress: ip,
      userAgent,
    });

    const cookieConfig = this.tokenService.getRefreshCookieConfig();
    res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
      maxAge: cookieConfig.maxAge,
    });

    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      user: result.user,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Refresh token missing, invalid, or session revoked' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshSessionResult> {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    try {
      const result = await this.loginService.refresh(rawRefreshToken);

      const cookieConfig = this.tokenService.getRefreshCookieConfig();
      res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path,
        maxAge: cookieConfig.maxAge,
      });

      return {
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      };
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Access token missing or invalid' })
  async me(@CurrentUser() principal: AuthenticatedPrincipal): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: { id: true, email: true, status: true },
    });

    return {
      id: user!.id,
      email: user!.email,
      status: user!.status as 'ACTIVE',
      roleCodes: principal.roleCodes,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @AllowRevokedSession()
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (principal.sessionId) {
      await this.sessionService.revokeSession(principal.sessionId);

      await this.auditService.recordBestEffort({
        action: 'auth.logout.completed',
        actorType: AuditActorType.USER,
        actorUserId: principal.userId,
        targetType: 'session',
        targetId: principal.sessionId,
        outcome: AuditOutcome.SUCCESS,
      });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  }
}
