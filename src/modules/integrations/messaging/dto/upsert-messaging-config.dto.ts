import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertMessagingConfigDto {
  @IsOptional()
  @IsString()
  whatsappMode?: 'api' | 'qr';

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappApiUrl?: string;

  @IsOptional()
  @IsString()
  whatsappApiKey?: string;

  @IsOptional()
  @IsString()
  whatsappInstance?: string;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsString()
  smsApiUrl?: string;

  @IsOptional()
  @IsString()
  smsApiKey?: string;

  @IsOptional()
  @IsString()
  smsSender?: string;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  emailApiUrl?: string;

  @IsOptional()
  @IsString()
  emailApiKey?: string;

  @IsOptional()
  @IsString()
  emailFrom?: string;
}
