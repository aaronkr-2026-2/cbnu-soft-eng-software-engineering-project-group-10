import { Injectable, HttpException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthRequest } from '../auth/session.guard.js';
@Injectable()
export class WriteLimitGuard implements CanActivate {
  private readonly entries = new Map<string, { count: number; end: number }>();
  canActivate(context: ExecutionContext) {
    const http = context.switchToHttp(),
      req = http.getRequest<AuthRequest>(),
      res = http.getResponse<Response>();
    const now = Date.now();
    for (const [id, e] of this.entries)
      if (e.end <= now) this.entries.delete(id);
    let e = this.entries.get(req.userId);
    if (!e && this.entries.size < 10000) {
      e = { count: 0, end: now + 60000 };
      this.entries.set(req.userId, e);
    }
    if (!e || e.count >= 60) {
      res.setHeader('Retry-After', e ? Math.ceil((e.end - now) / 1000) : 60);
      throw new HttpException('Too many writes. Try again later.', 429);
    }
    e.count++;
    return true;
  }
}
