import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { SessionGuard } from './auth/session.guard.js';
import { WriteLimitGuard } from './common/write-limit.guard.js';
import { ReportsService } from './reports/reports.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ImagesService } from './reports/images.service.js';
import { ImagesController } from './reports/images.controller.js';
import { ChatService } from './chat/chat.service.js';
import { ChatController } from './chat/chat.controller.js';
import { EventsController } from './chat/events.controller.js';
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    ReportsController,
    ImagesController,
    ChatController,
    EventsController,
  ],
  providers: [
    SessionGuard,
    WriteLimitGuard,
    ReportsService,
    ImagesService,
    ChatService,
  ],
})
export class FeaturesModule {}
