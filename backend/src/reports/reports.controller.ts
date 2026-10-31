import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, type AuthRequest } from '../auth/session.guard.js';
import { ReportsService } from './reports.service.js';
import { WriteLimitGuard } from '../common/write-limit.guard.js';
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('catalogs') catalogs() {
    return this.reports.catalogs();
  }
  @Get('reports') list(@Query() query: unknown) {
    return this.reports.list(query);
  }
  @Get('me/reports') @UseGuards(SessionGuard) mine(
    @Req() req: AuthRequest,
    @Query() query: unknown,
  ) {
    return this.reports.list(query, req.userId);
  }
  @Get('reports/:id') detail(@Param('id') id: string) {
    return this.reports.detail(id);
  }
  @Post('reports') @UseGuards(SessionGuard, WriteLimitGuard) create(
    @Req() req: AuthRequest,
    @Body() body: unknown,
  ) {
    return this.reports.create(req.userId, body);
  }
  @Patch('reports/:id') @UseGuards(SessionGuard, WriteLimitGuard) update(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: unknown,
  ) {
    return this.reports.update(id, req.userId, body);
  }
  @Delete('reports/:id') @UseGuards(SessionGuard, WriteLimitGuard) remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    return this.reports.remove(id, req.userId);
  }
}
