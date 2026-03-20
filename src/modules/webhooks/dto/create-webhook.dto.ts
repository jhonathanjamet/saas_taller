import { IsOptional, IsString } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  url!: string;

  @IsOptional()
  events?: string[];
}
