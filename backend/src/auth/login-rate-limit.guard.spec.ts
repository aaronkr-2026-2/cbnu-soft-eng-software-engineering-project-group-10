import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';

function context(ip: string) {
  const setHeader = vi.fn();
  return {
    setHeader,
    value: {
      switchToHttp: () => ({
        getRequest: () => ({ socket: { remoteAddress: ip } }),
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext,
  };
}
describe('LoginRateLimitGuard', () => {
  afterEach(() => vi.restoreAllMocks());
  it('allows ten attempts, rejects the eleventh with 429 and Retry-After', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const guard = new LoginRateLimitGuard();
    const ctx = context('127.0.0.1');
    for (let i = 0; i < 10; i++)
      expect(guard.canActivate(ctx.value)).toBe(true);
    try {
      guard.canActivate(ctx.value);
      expect.unreachable('must reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
    expect(ctx.setHeader).toHaveBeenCalledWith('Retry-After', 60);
    expect(guard.canActivate(context('127.0.0.2').value)).toBe(true);
  });
  it('blocked requests do not extend the window; resets at exactly 60 seconds', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const guard = new LoginRateLimitGuard();
    const ctx = context('127.0.0.1');
    for (let i = 0; i < 10; i++) guard.canActivate(ctx.value);
    clock.mockReturnValue(60_999);
    expect(() => guard.canActivate(ctx.value)).toThrow(HttpException);
    expect(ctx.setHeader).toHaveBeenLastCalledWith('Retry-After', 1);
    clock.mockReturnValue(61_000);
    expect(guard.canActivate(ctx.value)).toBe(true);
  });
});
