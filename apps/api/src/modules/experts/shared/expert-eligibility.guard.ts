import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ExpertEligibilityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const isExpert = user.roles?.some((r: string) => r === 'expert');
    if (!isExpert) {
      throw new ForbiddenException('Expert role required');
    }

    return true;
  }
}
