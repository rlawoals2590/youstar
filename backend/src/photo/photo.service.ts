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
  private region: string = process.env.AWS_REGION;
  private bucket: string = process.env.S3_BUCKET_NAME;

  constructor(
    @InjectModel(Photo.name) private readonly photoModel: Model<Photo>,
  ) {
    this.s3Client = new S3Client({
      region: this.region, // AWS Region
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY, // Access Key
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY, // Secret Key
      },
    });
    this.client = new Client({});
  }

  async getAllPhotos(req: Request) {
    // const user_id = req['user']['_id'];
    const user_id = 'tasoidhahs';
    const user_photos = await this.photoModel.find({ user_id }).exec();

    if (!user_photos) {
      throw new UnauthorizedException(
        'User dont have photos with id ' + user_id,
      );
    }

    const imageUrls = [];
    for (const image of user_photos) {
      const extName = image.name.split('.')[1];
      const imageUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${image.user_id}/${image.image_id}.${extName}`;
      imageUrls.push({ imageUrl });
    }

    return imageUrls;
  }

  async getUploadUrl(
    user_id: string,
    image_id: string,
    type: string,
  ): Promise<string> {
    const extName = type.split('/')[1];
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `${user_id}/${image_id}.${extName}`,
      ContentType: type,
    });
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 10,
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
        // user_id: req['user']['_id'],
        user_id: 'tasoidhahs',
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

    return this.getUploadUrl(user_id, photo.image_id, file.mimetype);
  }
}
