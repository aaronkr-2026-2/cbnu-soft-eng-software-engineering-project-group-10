import {
  Controller,
  Get,
  HttpException,
  OnModuleDestroy,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { SessionGuard, type AuthRequest } from '../auth/session.guard.js';
import { ChatService } from './chat.service.js';
@Controller('conversations')
export class EventsController implements OnModuleDestroy {
  private readonly connections = new Map<Response, string>();
  constructor(
    private readonly chat: ChatService,
    private readonly auth: AuthService,
  ) {}
  @Get(':id/events')
  @UseGuards(SessionGuard)
  async events(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    await this.chat.member(id, req.userId);
    if (
      this.connections.size >= 100 ||
      [...this.connections.values()].filter((user) => user === req.userId)
        .length >= 3
    )
      throw new HttpException('Too many event streams', 429);
    this.connections.set(res, req.userId);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    let previous: unknown = undefined,
      busy = false,
      closed = false;
    const write = (event: string, data: unknown) => {
      if (
        !closed &&
        !res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      )
        res.end();
    };
    write('ready', { conversation_id: id });
    const tick = async () => {
      if (busy || closed) return;
      busy = true;
      try {
        await this.auth.authenticate(req.headers.authorization);
        const version = await this.chat.version(id, req.userId);
        if (closed) return;
        if (version !== previous) {
          previous = version;
          write('refresh', { conversation_id: id });
        } else res.write(': heartbeat\n\n');
      } catch (error) {
        if (
          error instanceof HttpException &&
          [401, 404].includes(error.getStatus())
        )
          write('session-ended', { status: error.getStatus() });
        else write('unavailable', { retry: true });
        res.end();
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(() => void tick(), 2000);
    const cleanup = () => {
      closed = true;
      clearInterval(timer);
      this.connections.delete(res);
    };
    res.on('close', cleanup);
    res.on('error', cleanup);
    void tick();
  }
  onModuleDestroy() {
    for (const res of this.connections.keys()) res.end();
    this.connections.clear();
  }
}
