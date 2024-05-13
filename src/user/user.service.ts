import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.schema';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  async signup(body: CreateUserDto) {
    const { email, name, password } = body;
    const isUserExist = await this.userModel.exists({ email });

    if (isUserExist) {
      throw new UnauthorizedException('Already exists the user!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      email,
      name,
      password: hashedPassword,
    });

    return user.name;
  }

  async login(body: LoginUserDto, res: Response) {
    const { email, password } = body;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException("This email doesn't exist");
    }

    const validatePassword = await bcrypt.compare(password, user.password)
    
    if (!validatePassword) {
      throw new UnauthorizedException("Passwords do not match");
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload)

    res.setHeader('Authorization', 'Bearer ' + access_token);
    res.cookie('acces_token', access_token,{
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 //1 day
    });

    return res.send({
      message: 'success'
    });
  }

  getCookies(req: Request, res: Response) {
    const acces_token = req.cookies['acces_token'];
    return res.send(acces_token);
  }

  logout(res: Response) {
    res.cookie('acces_token', '', {
      maxAge: 0
    });
    
    return res.send({
        message: 'success'
    });
  }
}