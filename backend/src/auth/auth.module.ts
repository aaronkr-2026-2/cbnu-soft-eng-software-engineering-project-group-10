import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, LoginRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
