import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkOrderTaskDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
