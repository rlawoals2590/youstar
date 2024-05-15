import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  controllers: [PhotoController],
  providers: [PhotoService, S3Client],
})
export class PhotoModule {}
