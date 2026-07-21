export interface RedisReadiness {
  status: 'up' | 'down';
}

export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  tls: boolean;
  connectTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
}
