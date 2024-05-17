import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Client } from '@googlemaps/google-maps-services-js';
import { InjectModel } from '@nestjs/mongoose';
import { Photo } from './entities/photo.entity';
import { Model } from 'mongoose';
import { readFileSync } from 'fs';
import * as ExifParser from 'exif-parser';
import { v1 as uuid } from 'uuid';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotoService {
  private s3Client: S3Client;
  private client: Client;
  private apiKey: string = process.env.GCP_API;

  constructor(
    @InjectModel(Photo.name) private readonly photoModel: Model<Photo>,
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION, // AWS Region
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY, // Access Key
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY, // Secret Key
      },
    });
    this.client = new Client({});
  }

  async getUploadUrl(image_id: string, type: string): Promise<string> {
    const extName = type.split('/')[1];
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `profile/${image_id}.${extName}`,
      ContentType: type,
    });
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 60,
    });
  }

  async getImageInfo(
    file: Express.Multer.File,
    req: Request,
  ): Promise<CreatePhotoDto> {
    const buffer = readFileSync(file.path);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    const dateTaken = result.tags.DateTimeOriginal;
    const latitude = result.tags.GPSLatitude;
    const longitude = result.tags.GPSLongitude;

    try {
      let location = null;
      if (latitude && longitude) {
        const response = await this.client.reverseGeocode({
          params: {
            latlng: [latitude, longitude],
            key: this.apiKey,
            language: 'ko' as any,
          },
          timeout: 1000,
        });
        // console.log(response.data.results[0]); // 응답 데이터 로그 출력

        const formatted_address = response.data.results[0].formatted_address;

        location = {
          latitude,
          longitude,
          formatted_address,
        };
      }

      return {
        image_id: uuid(),
        user_id: req['user']['_id'],
        name: file.originalname,
        date: dateTaken ? new Date(dateTaken * 1000) : null,
        location: location,
      };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to reverse geocode');
    }
  }

  async uploadImage(file: Express.Multer.File, req: Request) {
    const body = await this.getImageInfo(file, req);
    const { image_id, user_id, name, date, location } = body;
    const isImageExist = await this.photoModel.exists({ user_id, name });

    if (isImageExist) {
      throw new UnauthorizedException('Image already exists');
    }

    const photo = await this.photoModel.create({
      image_id,
      user_id,
      name,
      date,
      location,
    });

    return this.getUploadUrl(photo.image_id, file.mimetype);
  }
}
