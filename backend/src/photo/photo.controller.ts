import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UseGuards,
  Req,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { PhotoService } from './photo.service';
import { FileInterceptor } from '@nestjs/platform-express';
import JwtAuthenticationGuard from 'src/user/user-authentication.guard';

@Controller('Photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.photoService.uploadImage(file, req);
  }
}
