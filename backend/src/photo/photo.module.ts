import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { S3Client } from '@aws-sdk/client-s3';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { Photo, PhotoSchema} from "./entities/photo.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Photo.name,
        schema: PhotoSchema,
      },
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [PhotoController],
  providers: [PhotoService, S3Client],
})
export class PhotoModule {}
