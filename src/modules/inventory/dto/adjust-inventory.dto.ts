import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustInventoryDto {
  @IsString()
  productId!: string;

  @IsString()
  branchId!: string;

  @IsNumber()
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
