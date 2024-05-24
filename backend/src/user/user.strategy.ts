import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';

@Injectable()
export class UserStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }
  async validate(payload: TokenPayload) {
    return this.userService.getById(payload.userId);
  }
}
