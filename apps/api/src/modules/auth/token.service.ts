import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  roles: string[];
  type: 'access';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AccessTokenVerified {
  userId: string;
  sessionId: string;
  roleCodes: string[];
}

export interface CookieConfig {
  name: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenSecret: string;
  private readonly refreshTokenBytes = 32;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTokenTTLMinutes: number;
  private readonly refreshTokenTTLDays: number;
  private readonly cookieName: string;

  constructor(private readonly configService: ConfigService) {
    this.accessTokenSecret = this.configService.get<string>(
      'AUTH_ACCESS_TOKEN_SECRET',
      'local-dev-secret-min-32-chars!!',
    );
    this.issuer = this.configService.get<string>('AUTH_JWT_ISSUER', 'nexthire');
    this.audience = this.configService.get<string>('AUTH_JWT_AUDIENCE', 'nexthire-api');
    this.accessTokenTTLMinutes = this.configService.get<number>(
      'AUTH_ACCESS_TOKEN_TTL_MINUTES',
      15,
    );
    this.refreshTokenTTLDays = this.configService.get<number>('AUTH_REFRESH_TOKEN_TTL_DAYS', 30);
    this.cookieName = this.configService.get<string>(
      'AUTH_REFRESH_COOKIE_NAME',
      'nexthire_refresh',
    );
  }

  signAccessToken(
    userId: string,
    sessionId: string,
    roleCodes: string[],
  ): { token: string; expiresAt: string } {
    const exp = Math.floor(Date.now() / 1000) + this.accessTokenTTLMinutes * 60;
    const expDate = new Date(exp * 1000);

    const payload: Record<string, unknown> = {
      sub: userId,
      sid: sessionId,
      roles: roleCodes,
      type: 'access',
      iss: this.issuer,
      aud: this.audience,
      iat: Math.floor(Date.now() / 1000),
      exp,
    };

    const token = jwt.sign(payload, this.accessTokenSecret, { algorithm: 'HS256' });
    return { token, expiresAt: expDate.toISOString() };
  }

  verifyAccessToken(token: string): AccessTokenVerified {
    const payload = jwt.verify(token, this.accessTokenSecret, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & { sid?: string; roles?: string[]; type?: string };

    if (payload.type !== 'access' || !payload.sub || !payload.sid) {
      throw new Error('Invalid token claims');
    }

    return {
      userId: payload.sub as string,
      sessionId: payload.sid as string,
      roleCodes: (payload.roles as string[]) ?? [],
    };
  }

  generateRefreshToken(): { raw: string; hash: string } {
    const raw = crypto.randomBytes(this.refreshTokenBytes).toString('base64url');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
  }

  hashRefreshToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  getRefreshCookieConfig(): CookieConfig {
    const isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';
    return {
      name: this.cookieName,
      path: '/api/v1/auth',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: this.refreshTokenTTLDays * 24 * 60 * 60,
    };
  }

  getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.refreshTokenTTLDays * 24 * 60 * 60 * 1000);
  }

  clearCookieConfig(): CookieConfig {
    return {
      ...this.getRefreshCookieConfig(),
      maxAge: 0,
    };
  }
}
