import { AuthenticatedPrincipal } from '../../modules/auth/interfaces/authenticated-principal.interface';

export interface RequestContext {
  requestId: string;
  actor?: AuthenticatedPrincipal;
  ipAddress?: string;
  userAgent?: string;
}
