import { Module } from '@nestjs/common';
import { S3ConfigController } from './s3-config.controller';
import { S3ConfigService } from './s3-config.service';

@Module({
  controllers: [S3ConfigController],
  providers: [S3ConfigService],
})
export class S3ConfigModule {}
