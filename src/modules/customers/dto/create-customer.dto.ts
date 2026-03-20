import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';

export enum CustomerTypeDto {
  person = 'person',
  company = 'company',
}

export class CreateCustomerDto {
  @IsEnum(CustomerTypeDto)
  type: CustomerTypeDto = CustomerTypeDto.person;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
