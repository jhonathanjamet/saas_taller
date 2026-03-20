import { IsOptional, IsString } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  quoteNumber!: string;

  @IsString()
  branchId!: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;
}
