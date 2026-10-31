import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DatabaseModule } from '../database/database.module.js';
import {
  LoginRateLimitGuard,
  SignupRateLimitGuard,
} from './login-rate-limit.guard.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, LoginRateLimitGuard, SignupRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
