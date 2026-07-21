import { SetMetadata } from '@nestjs/common';
import { ALLOW_REVOKED_SESSION_KEY } from '../auth.constants';

export const AllowRevokedSession = () => SetMetadata(ALLOW_REVOKED_SESSION_KEY, true);
