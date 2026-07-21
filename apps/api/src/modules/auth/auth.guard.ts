import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { TokenService } from './token.service';
import type { AccessTokenVerified } from './token.service';
import { SessionService } from './session.service';
import { RequestContextService } from '../../common/request-context';
import { IS_PUBLIC_KEY, ALLOW_REVOKED_SESSION_KEY } from './auth.constants';
import { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import { AUTH_ERROR_CODES } from '@nexthire/constants';

export interface AuthenticatedRequest extends Request {
  principal: AuthenticatedPrincipal;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const allowRevoked = this.reflector.getAllAndOverride<boolean>(ALLOW_REVOKED_SESSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.ACCESS_TOKEN_MISSING);
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID);
    }

    let verified: AccessTokenVerified;
    try {
      verified = this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException(AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID);
    }

    const session = await this.sessionService.findSessionById(verified.sessionId);

    if (!session) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.SESSION_REVOKED);
    }

    if (!allowRevoked && (session.status === 'REVOKED' || session.status === 'COMPROMISED')) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.SESSION_REVOKED);
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.SESSION_EXPIRED);
    }

    const principal: AuthenticatedPrincipal = {
      userId: verified.userId,
      sessionId: verified.sessionId,
      roleCodes: verified.roleCodes,
      permissionCodes: [],
    };

    this.requestContextService.setPrincipal(principal);
    (request as AuthenticatedRequest).principal = principal;

    if (session.id) {
      void this.sessionService.updateLastUsedAt(session.id);
    }

    return true;
  }
}
