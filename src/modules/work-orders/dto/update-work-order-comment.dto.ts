import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkOrderCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
