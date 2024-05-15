import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import JwtAuthenticationGuard from 'src/user/user-authentication.guard';

@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get('upload-url')
  @UseGuards(JwtAuthenticationGuard)
  async getUploadUrl(@Req() req: Request, @Query('type') type: string) {
    return this.photoService.getUploadUrl(req['user']['_id'], type);
  }
}
