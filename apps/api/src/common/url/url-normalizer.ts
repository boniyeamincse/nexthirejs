export interface NormalizedUrlResult {
  displayUrl: string;
  normalizedUrl: string;
}

export class UrlNormalizer {
  static normalize(url: string): NormalizedUrlResult {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    if (parsed.username || parsed.password) {
      throw new Error('URL must not contain embedded credentials');
    }

    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();

    let port = '';
    if (parsed.port) {
      const defaultPorts = { 'http:': '80', 'https:': '443' };
      if (parsed.port !== defaultPorts[protocol as keyof typeof defaultPorts]) {
        port = `:${parsed.port}`;
      }
    }

    const pathname = parsed.pathname;
    const search = parsed.search;
    const hash = parsed.hash;

    const displayUrl = `${protocol}//${hostname}${port}${pathname}${search}${hash}`;

    const normalizedPath = pathname.endsWith('/') && pathname.length > 1
      ? pathname.replace(/\/+$/, '')
      : pathname;

    const normalizedUrl = `${protocol}//${hostname}${port}${normalizedPath}${search}`;

    return { displayUrl, normalizedUrl };
  }
}
