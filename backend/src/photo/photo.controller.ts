import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UseGuards,
  Req,
  Query,
  UploadedFile, Res, Delete, Param,
} from '@nestjs/common';
import { PhotoService } from './photo.service';
import { FileInterceptor } from '@nestjs/platform-express';
import JwtAuthenticationGuard from 'src/user/user-authentication.guard';

@Controller('Photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  @UseGuards(JwtAuthenticationGuard)
  getAllPhotos(@Req() req: Request) {
    return this.photoService.getAllPhotos(req);
  }

  @Post('upload')
  // @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.photoService.uploadPhoto(file, req);
  }

  @Delete('delete/:photo_id')
  @UseGuards(JwtAuthenticationGuard)
  deletePhoto(@Param('photo_id') photo_id: string) {
    return this.photoService.deletePhoto(photo_id);
  }
}
