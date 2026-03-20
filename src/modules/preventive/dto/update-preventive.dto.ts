import { PartialType } from '@nestjs/swagger';
import { CreatePreventiveDto } from './create-preventive.dto';

export class UpdatePreventiveDto extends PartialType(CreatePreventiveDto) {}
