import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  protected maximum = 10;
  private readonly attempts = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    // Express uses forwarding headers only for explicitly trusted proxy addresses.
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (entry.expiresAt <= now) this.attempts.delete(key);
    }
    let entry = this.attempts.get(ip);
    if (!entry) {
      // Bound memory without evicting active limits and enabling bypass.
      if (this.attempts.size >= 10_000) return this.reject(response, 60);
      entry = { count: 0, expiresAt: now + 60_000 };
      this.attempts.set(ip, entry);
    }
    if (entry.count >= this.maximum) {
      return this.reject(response, Math.ceil((entry.expiresAt - now) / 1000));
    }
    entry.count += 1;
    return true;
  }

  private reject(response: Response, retryAfter: number): never {
    response.setHeader('Retry-After', retryAfter);
    throw new HttpException(
      'Too many authentication attempts. Try again later.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Injectable()
export class SignupRateLimitGuard extends LoginRateLimitGuard {
  protected override maximum = 30;
}
