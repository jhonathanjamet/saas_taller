import { IsOptional, IsString } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  orderNumber!: string;

  @IsString()
  branchId!: string;

  @IsString()
  supplierId!: string;

  @IsOptional()
  @IsString()
  status?: string;
}
