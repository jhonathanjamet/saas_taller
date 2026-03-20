import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  settings?: any;

  @IsOptional()
  taxRate?: number;
}
