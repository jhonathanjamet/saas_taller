import { IsOptional, IsString } from 'class-validator';

export class CreateNotificationLogDto {
  @IsString()
  channel!: string;

  @IsString()
  recipient!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
