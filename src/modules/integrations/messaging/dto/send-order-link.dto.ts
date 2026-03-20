import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class SendOrderLinkDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  orderUrl!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  toPhone?: string;

  @IsOptional()
  @IsString()
  toEmail?: string;

  @IsArray()
  @IsIn(['whatsapp', 'sms', 'email'], { each: true })
  channels!: Array<'whatsapp' | 'sms' | 'email'>;
}
