import { Controller, Get, Post, Body, Patch, Param, Req, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Request, Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  async signup(@Body() body: CreateUserDto) {
    return await this.userService.signup(body);
  }

  @Post('/login')
  async login(@Body() body: LoginUserDto, @Res() res: Response){
    return await this.userService.login(body, res);
  }

  @Get('/cookies')
  getCookies(@Req() req: Request, @Res() res: Response) {
    return this.userService.getCookies(req, res);
  }

  @Post('/logout')
  logout(@Res() res: Response) {
    return this.userService.logout(res);
  }
}
