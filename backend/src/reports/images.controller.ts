import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SessionGuard, type AuthRequest } from '../auth/session.guard.js';
import { WriteLimitGuard } from '../common/write-limit.guard.js';
import { ImagesService } from './images.service.js';
@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}
  @Post('reports/:id/images')
  @UseGuards(SessionGuard, WriteLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
    }),
  )
  upload(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.images.upload(id, req.userId, file);
  }
  @Get('images/:id') async read(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.images.read(id);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(image.data, {
      type: image.content_type,
      length: image.data.length,
    });
  }
  @Delete('reports/:report/images/:id')
  @UseGuards(SessionGuard, WriteLimitGuard)
  remove(
    @Param('report') report: string,
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    return this.images.remove(report, id, req.userId);
  }
}
