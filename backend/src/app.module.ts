import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { TasksModule } from './tasks/tasks.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [TasksModule, AuthModule, DatabaseModule],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
