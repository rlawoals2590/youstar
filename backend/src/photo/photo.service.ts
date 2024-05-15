import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class PhotoService {
  s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION, // AWS Region
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY, // Access Key
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY, // Secret Key
      },
    });
  }

  async getUploadUrl(userId: string, type: string): Promise<string> {
    const extName = type.split('/')[1];	// type은 file.type이다. 즉, image/jpeg 또는 image/png가 들어오기 때문에 extName에는 파일의 확장자가 들어가게 된다.
    
    // 내가 S3에 하려는 작업을 명시한다.
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `profile/${userId}.${extName}`,
      ContentType: type,
    });
    
    // Presigned URL을 생성해서 반환한다.
    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 60,
    });
    return signedUrl;
  }
}
