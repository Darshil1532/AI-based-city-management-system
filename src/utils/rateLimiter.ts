/**
 * Rate Limiter for Google Maps API & Geocoding requests
 * Implements a sliding window algorithm to safeguard against quota exhaustion,
 * rapid clicks, and unauthorized billing spikes.
 */

export interface RateLimitStatus {
  currentCount: number;
  maxRequests: number;
  windowSeconds: number;
  isLimited: boolean;
  remainingSeconds: number;
}

class MapsRateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number = 10; // Max 10 requests
  private windowMs: number = 60 * 1000; // per 60 seconds (1 minute window)
  private listeners: Array<(status: RateLimitStatus) => void> = [];

  constructor(maxRequests = 10, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  public getStatus(): RateLimitStatus {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    const isLimited = this.timestamps.length >= this.maxRequests;
    let remainingSeconds = 0;
    if (isLimited && this.timestamps.length > 0) {
      const oldest = this.timestamps[0];
      const expiry = oldest + this.windowMs;
      remainingSeconds = Math.max(0, Math.ceil((expiry - now) / 1000));
    }

    return {
      currentCount: this.timestamps.length,
      maxRequests: this.maxRequests,
      windowSeconds: Math.round(this.windowMs / 1000),
      isLimited,
      remainingSeconds,
    };
  }

  public recordRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      this.notify();
      return false; // Request blocked by rate limiter
    }

    this.timestamps.push(now);
    this.notify();
    return true; // Allowed
  }

  public forceTriggerLimit(): void {
    const now = Date.now();
    this.timestamps = Array.from({ length: this.maxRequests }, () => now);
    this.notify();
  }

  public reset(): void {
    this.timestamps = [];
    this.notify();
  }

  public subscribe(callback: (status: RateLimitStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }
}

export const mapsRateLimiter = new MapsRateLimiter(10, 60);
