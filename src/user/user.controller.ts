import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signUp')
  async signUp(@Body() body: CreateUserDto) {
    return await this.userService.signUp(body);
  }

  @Post('/login')
  login(@Body() body: LoginUserDto){
    return this.userService.login(body);
  }
}
