import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UseGuards } from '@nestjs/common';
import {
  LoginRateLimitGuard,
  SignupRateLimitGuard,
} from './login-rate-limit.guard.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') @UseGuards(SignupRateLimitGuard) register(
    @Body() body: unknown,
  ) {
    return this.auth.register(body);
  }
  @Post('login') @UseGuards(LoginRateLimitGuard) @HttpCode(200) login(
    @Body() body: unknown,
  ) {
    return this.auth.login(body);
  }
  @Get('me') me(@Headers('authorization') header?: string) {
    return this.auth.me(header);
  }
  @Post('logout') @HttpCode(200) logout(
    @Headers('authorization') header?: string,
  ) {
    return this.auth.logout(header);
  }
}
