import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Client } from '@googlemaps/google-maps-services-js';
import { InjectModel } from '@nestjs/mongoose';
import { Photo } from './entities/photo.entity';
import { Model } from 'mongoose';
import { readFileSync } from 'fs';
import * as ExifParser from 'exif-parser';
import { v1 as uuid } from 'uuid';
import { CreatePhotoDto } from './dto/create-photo.dto';
import * as Ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

Ffmpeg.setFfmpegPath(ffmpegPath);
Ffmpeg.setFfprobePath(ffprobePath.path);

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

    const photos_list = [];
    for (const photo of user_photos) {
      const photoUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${photo.user_id}/${photo.photo_id}.${photo.ext}`;
      photos_list.push({ photo, photoUrl });
    }

    return photos_list;
  }

  async getUploadUrl(
    user_id: string,
    photo_id: string,
    type: string,
  ): Promise<string> {
    const extName = type.split('/')[1];
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `${user_id}/${photo_id}.${extName}`,
      ContentType: type,
    });
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 5,
    });
  }

  async getPhotoLocation(latitude: number, longitude: number) {
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

      return {
        latitude,
        longitude,
        formatted_address,
      };
    }
  }

  async getPhotoInfo(
    file: Express.Multer.File,
    req: Request,
  ): Promise<CreatePhotoDto> {
    const isVideo = file.mimetype.startsWith('video/');
    let dateTaken;
    let latitude: number;
    let longitude: number;

    if (isVideo) {
      // 동영상 파일의 메타데이터 추출
      await new Promise((resolve, reject) => {
        Ffmpeg.ffprobe(file.path, (err, metadata) => {
          if (err) {
            return reject(err);
          }
          const iso6709 =
            metadata.format.tags?.['com.apple.quicktime.location.ISO6709'];
          if (iso6709) {
            if (typeof iso6709 !== 'number') {
              [latitude, longitude] = iso6709
                .match(/[+-]\d+\.\d+/g)
                .map(Number);
            }
          }
          dateTaken =
            metadata.format.tags?.['com.apple.quicktime.creationdate'];
          if (dateTaken) {
            const parsedDate = new Date(dateTaken);
            if (!isNaN(parsedDate.getTime())) {
              dateTaken = Math.floor(parsedDate.getTime() / 1000); // 초 단위로 변환
            } else {
              console.warn(`Invalid creation_time: ${dateTaken}`);
            }
          }
          resolve(file);
        });
      });
    } else {
      // 이미지 파일의 메타데이터 추출
      const buffer = readFileSync(file.path);
      const parser = ExifParser.create(buffer);
      const result = parser.parse();

      dateTaken = result.tags.DateTimeOriginal;
      latitude = result.tags.GPSLatitude;
      longitude = result.tags.GPSLongitude;
    }

    try {
      const location = await this.getPhotoLocation(latitude, longitude);
      return {
        photo_id: uuid(),
        // user_id: req['user']['_id'],
        user_id: 'tasoidhahs',
        name: file.originalname,
        date: dateTaken ? new Date(dateTaken * 1000) : null,
        ext: file.mimetype.split('/')[1],
        location: location,
      };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to reverse geocode');
    }
  }

  async uploadPhoto(file: Express.Multer.File, req: Request) {
    const body = await this.getPhotoInfo(file, req);
    const { photo_id, user_id, name, date, ext, location } = body;
    const isImageExist = await this.photoModel.exists({ user_id, name });

    if (isImageExist) {
      throw new UnauthorizedException('Image already exists');
    }

    const photo = await this.photoModel.create({
      photo_id,
      user_id,
      name,
      date,
      ext,
      location,
    });

    return this.getUploadUrl(user_id, photo.photo_id, file.mimetype);
  }

  async deletePhoto(photo_id: string) {
    const photo = await this.photoModel.findOneAndDelete({ photo_id });
    if (!photo) {
      throw new UnauthorizedException('Image not found');
    }
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: `${photo.user_id}/${photo_id}.${photo.ext}`,
    });

    return await this.s3Client.send(command);
  }
}
