import { IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkOrderTaskStatus } from '@prisma/client';

export class UpdateWorkOrderTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  status?: WorkOrderTaskStatus;
}
