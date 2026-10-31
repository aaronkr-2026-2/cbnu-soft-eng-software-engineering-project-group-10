import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, type AuthRequest } from '../auth/session.guard.js';
import { WriteLimitGuard } from '../common/write-limit.guard.js';
import { ChatService } from './chat.service.js';
@Controller('conversations')
@UseGuards(SessionGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}
  @Post() @UseGuards(WriteLimitGuard) create(
    @Req() req: AuthRequest,
    @Body() body: unknown,
  ) {
    return this.chat.create(req.userId, body);
  }
  @Get() list(@Req() req: AuthRequest, @Query() q: unknown) {
    return this.chat.list(req.userId, q);
  }
  @Get(':id/messages') history(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Query() q: unknown,
  ) {
    return this.chat.history(id, req.userId, q);
  }
  @Post(':id/messages') @UseGuards(WriteLimitGuard) send(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: unknown,
  ) {
    return this.chat.send(id, req.userId, body);
  }
}
