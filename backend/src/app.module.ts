import { FeaturesModule } from './features.module.js';
import { HealthController } from './health.controller.js';
import { APP_FILTER } from '@nestjs/core';
import { SafeErrorFilter } from './common/safe-error.filter.js';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { TasksModule } from './tasks/tasks.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [TasksModule, AuthModule, DatabaseModule, FeaturesModule],

  controllers: [AppController, HealthController],
  providers: [AppService, { provide: APP_FILTER, useClass: SafeErrorFilter }],
})
export class AppModule {}
