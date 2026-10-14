import { BadRequestException } from '@nestjs/common';
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BadRequestException('JSON object required');
  return value as Record<string, unknown>;
}
export function text(value: unknown, name: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new BadRequestException(`Invalid ${name}`);
  return value.trim();
}
