/**
 * Client IP extraction with trusted-proxy awareness.
 *
 * Express is not configured with `trust proxy` globally, so `req.ip` reflects
 * the socket peer. When the platform runs behind a known reverse proxy we may
 * honour `X-Forwarded-For`, but ONLY when the immediate peer is a trusted
 * proxy. This prevents clients from spoofing their IP for audit records or
 * rate limiting. The trusted proxy CIDRs/addresses come from configuration.
 */

import type { Request } from 'express';

function parseTrustedProxies(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normalizeIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  // Strip IPv6-mapped IPv4 prefix for consistent comparison/storage.
  return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
}

/**
 * Resolves the best-effort client IP address for a request.
 *
 * @param req Express request.
 * @param trustedProxyConfig Comma-separated list of trusted proxy addresses
 *   (from `TRUSTED_PROXY_IPS`). When empty, X-Forwarded-For is ignored.
 */
export function resolveClientIp(
  req: Request,
  trustedProxyConfig: string | undefined,
): string | undefined {
  const trusted = parseTrustedProxies(trustedProxyConfig);
  const peer = normalizeIp(req.socket?.remoteAddress ?? req.ip);

  if (trusted.length === 0) {
    return peer;
  }

  // Only trust the forwarded header if the direct peer is a configured proxy.
  if (peer && trusted.includes(peer)) {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (forwardedValue) {
      // Left-most entry is the original client.
      const first = forwardedValue.split(',')[0]?.trim();
      const normalized = normalizeIp(first);
      if (normalized) return normalized;
    }
  }

  return peer;
}
