import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: unknown) {
    return this.auth.register(body);
  }
  @Post('login') @HttpCode(200) login(@Body() body: unknown) {
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
