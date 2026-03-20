import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkOrderCommentDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  @IsString()
  kind?: 'note' | 'diagnostic';
}
