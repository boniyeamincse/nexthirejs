export interface AuthenticatedPrincipal {
  userId: string;
  sessionId?: string;
  roleCodes: string[];
  permissionCodes: string[];
}
