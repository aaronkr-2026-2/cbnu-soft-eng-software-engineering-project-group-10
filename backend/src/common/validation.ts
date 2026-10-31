import { BadRequestException } from '@nestjs/common';
import { object, text } from './input.js';
export function uuid(value: unknown, name = 'id'): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  )
    throw new BadRequestException(`Invalid ${name}`);
  return value.toLowerCase();
}
export function fields(input: unknown, allowed: string[]) {
  const data = object(input);
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    throw new BadRequestException('Unknown field');
  return data;
}
export function choice(value: unknown, values: string[], name: string): string {
  if (typeof value !== 'string' || !values.includes(value))
    throw new BadRequestException(`Invalid ${name}`);
  return value;
}
export function date(value: unknown): string {
  const v = text(value, 'occurred_on', 10);
  const parsed = new Date(v + 'T00:00:00Z');
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== v ||
    v > today ||
    v < '1900-01-01'
  )
    throw new BadRequestException('Invalid occurred_on');
  return v;
}
export function pagination(data: Record<string, unknown>) {
  const raw = data.limit ?? '20';
  if (
    typeof raw !== 'string' ||
    !/^\d+$/.test(raw) ||
    Number(raw) < 1 ||
    Number(raw) > 50
  )
    throw new BadRequestException('Invalid limit');
  let cursor: { time: string; id: string } | undefined;
  if (data.cursor !== undefined) {
    try {
      if (
        typeof data.cursor !== 'string' ||
        !/^[A-Za-z0-9_-]{1,512}$/.test(data.cursor)
      )
        throw new Error();
      const decoded = JSON.parse(
        Buffer.from(data.cursor, 'base64url').toString(),
      );
      if (
        decoded.v !== 1 ||
        typeof decoded.time !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(decoded.time) ||
        !Number.isFinite(Date.parse(decoded.time))
      )
        throw new Error();
      const d = new Date(decoded.time);
      if (d.getUTCFullYear() < 1970) throw new Error();
      if (d.toISOString().slice(0, 19) !== decoded.time.slice(0, 19))
        throw new Error();
      cursor = { time: decoded.time, id: uuid(decoded.id) };
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }
  return { limit: Number(raw), cursor };
}
export function page<T extends { id: string; cursor_time: string }>(
  rows: T[],
  limit: number,
) {
  const hasMore = rows.length > limit;
  const selected = rows.slice(0, limit);
  const last = selected.at(-1);
  return {
    items: selected.map(({ cursor_time: _cursor, ...row }) => row),
    next_cursor:
      hasMore && last
        ? Buffer.from(
            JSON.stringify({ v: 1, time: last.cursor_time, id: last.id }),
          ).toString('base64url')
        : null,
  };
}
