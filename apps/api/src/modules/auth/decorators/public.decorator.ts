import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants';

/**
 * Decorator that marks a route as public (bypassing authentication).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
