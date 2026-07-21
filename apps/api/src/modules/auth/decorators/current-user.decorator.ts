import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth.guard';
import { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedPrincipal | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedPrincipal | string | string[] | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;
    if (data) {
      return principal?.[data];
    }
    return principal;
  },
);
