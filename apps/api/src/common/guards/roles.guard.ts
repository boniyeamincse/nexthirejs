import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../../modules/auth/auth.guard';
import { AUTH_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;

    if (!principal) {
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCESS_TOKEN_MISSING);
    }

    const hasRole = requiredRoles.some((role) => principal.roleCodes.includes(role));

    if (!hasRole) {
      if (requiredRoles.includes('candidate')) {
         // Task specifies returning 403 CANDIDATE_ROLE_REQUIRED
         throw new ForbiddenException('CANDIDATE_ROLE_REQUIRED');
      }
      throw new ForbiddenException('ROLE_REQUIRED');
    }

    return true;
  }
}
