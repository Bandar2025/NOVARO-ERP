export interface RateLimiterStore {
  check(key: string, maxLimit: number, windowMs: number): Promise<boolean> | boolean;
}

export class InMemoryRateLimiter implements RateLimiterStore {
  private map = new Map<string, { count: number; resetTime: number }>();

  check(key: string, maxLimit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.map.get(key);

    if (!entry || now > entry.resetTime) {
      this.map.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxLimit) {
      return false;
    }

    entry.count++;
    return true;
  }
}

export const loginRateLimiter = new InMemoryRateLimiter();
