import { RequestContextService } from './request-context.service';
import { RequestContextMiddleware } from './request-context.middleware';
import { Request, Response } from 'express';

describe('RequestContext', () => {
  let middleware: RequestContextMiddleware;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
  });

  it('should generate a UUID if request ID is missing', (done) => {
    const req = { headers: {}, ip: '127.0.0.1' } as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    middleware.use(req, res, () => {
      const contextService = new RequestContextService();
      const requestId = contextService.getRequestId();
      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', requestId);
      done();
    });
  });

  it('should preserve a valid request ID', (done) => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const req = {
      headers: { 'x-request-id': validId },
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    middleware.use(req, res, () => {
      const contextService = new RequestContextService();
      const requestId = contextService.getRequestId();
      expect(requestId).toBe(validId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', validId);
      done();
    });
  });

  it('should replace an invalid request ID', (done) => {
    const invalidId = 'invalid-id-format';
    const req = {
      headers: { 'x-request-id': invalidId },
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    middleware.use(req, res, () => {
      const contextService = new RequestContextService();
      const requestId = contextService.getRequestId();
      expect(requestId).not.toBe(invalidId);
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      done();
    });
  });
});
