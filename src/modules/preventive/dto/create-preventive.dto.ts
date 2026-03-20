import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePreventiveDto {
  @IsString()
  assetId!: string;

  @IsString()
  name!: string;

  @IsString()
  frequencyType!: string;

  @IsNumber()
  frequencyValue!: number;

  @IsOptional()
  @IsNumber()
  alertBeforeValue?: number;
}
