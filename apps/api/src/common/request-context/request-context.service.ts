import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext } from './request-context.interface';
import { AuthenticatedPrincipal } from '../../modules/auth/interfaces/authenticated-principal.interface';

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  /**
   * Run a function within a new request context.
   */
  static run(context: RequestContext, callback: () => void): void {
    this.storage.run(context, callback);
  }

  /**
   * Retrieves the current RequestContext.
   */
  getContext(): RequestContext | undefined {
    return RequestContextService.storage.getStore();
  }

  /**
   * Retrieves the current Request ID.
   */
  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }

  /**
   * Retrieves the current authenticated principal if any.
   */
  getPrincipal(): AuthenticatedPrincipal | undefined {
    return this.getContext()?.actor;
  }

  /**
   * Sets the authenticated principal for the current request.
   */
  setPrincipal(actor: AuthenticatedPrincipal): void {
    const context = this.getContext();
    if (context) {
      context.actor = actor;
    }
  }
}
