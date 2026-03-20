import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertS3ConfigDto {
  @IsString()
  accessKeyId!: string;

  @IsString()
  secretAccessKey!: string;

  @IsString()
  bucket!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  basePath?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
