import { IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderDto {
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsString()
  branchId!: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsString()
  statusId!: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsString()
  initialDiagnosis?: string;

  @IsOptional()
  @IsString()
  technicalDiagnosis?: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  discountAmount?: number;

  @IsOptional()
  quoteApproved?: boolean;
}
