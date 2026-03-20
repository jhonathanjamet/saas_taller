import { IsOptional, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  assetTypeId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
