import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';
import { RequestContext } from './request-context.interface';
import { X_REQUEST_ID_HEADER } from '@nexthire/constants';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  // Simple UUID regex for validation
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  use(req: Request, res: Response, next: NextFunction): void {
    let requestId = req.headers[X_REQUEST_ID_HEADER.toLowerCase()] as string;

    // Validate the provided request ID. If missing or invalid, generate a new UUID.
    if (!requestId || !this.isValidUUID(requestId)) {
      requestId = randomUUID();
    }

    // Always set the response header
    res.setHeader(X_REQUEST_ID_HEADER, requestId);

    const context: RequestContext = {
      requestId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    // Run the next middleware within the new AsyncLocalStorage context
    RequestContextService.run(context, () => {
      next();
    });
  }

  private isValidUUID(id: string): boolean {
    return RequestContextMiddleware.UUID_REGEX.test(id) && id.length <= 100;
  }
}
