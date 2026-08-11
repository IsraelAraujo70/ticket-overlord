import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EventImageStorage,
  type StoreEventImageInput,
} from '../../application/ports/event-image-storage';

@Injectable()
export class S3EventImageStorage extends EventImageStorage {
  private readonly bucket: string;
  private readonly expiresIn: number;
  private readonly writeClient: S3Client;
  private readonly readUrlClient: S3Client;

  constructor(config: ConfigService) {
    super();
    this.bucket = config.getOrThrow<string>('S3_BUCKET');
    this.expiresIn = config.getOrThrow<number>('S3_PRESIGNED_URL_TTL_SECONDS');
    const region = config.getOrThrow<string>('S3_REGION');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined;
    const forcePathStyle =
      config.getOrThrow<string>('S3_FORCE_PATH_STYLE') === 'true';
    const endpoint = config.get<string>('S3_ENDPOINT_URL');
    const publicEndpoint =
      config.get<string>('S3_PUBLIC_ENDPOINT_URL') ?? endpoint;

    this.writeClient = new S3Client({
      region,
      ...(credentials ? { credentials } : {}),
      forcePathStyle,
      ...(endpoint ? { endpoint } : {}),
    });
    this.readUrlClient = new S3Client({
      region,
      ...(credentials ? { credentials } : {}),
      forcePathStyle,
      ...(publicEndpoint ? { endpoint: publicEndpoint } : {}),
    });
  }

  async store(input: StoreEventImageInput): Promise<void> {
    await this.writeClient.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentLength: input.body.length,
        ContentType: input.contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.writeClient.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  createReadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.readUrlClient,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.expiresIn },
    );
  }
}
