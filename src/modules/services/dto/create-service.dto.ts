import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}
