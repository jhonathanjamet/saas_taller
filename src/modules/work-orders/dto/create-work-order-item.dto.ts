import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWorkOrderItemDto {
  @IsIn(['product', 'service', 'additional'])
  itemType!: 'product' | 'service' | 'additional';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;
}
