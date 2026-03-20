import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PreventiveService } from './preventive.service';
import { CreatePreventiveDto } from './dto/create-preventive.dto';
import { UpdatePreventiveDto } from './dto/update-preventive.dto';

@ApiTags('preventive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('preventive')
export class PreventiveController {
  constructor(private readonly preventive: PreventiveService) {}

  @Get()
  @RequirePermission('preventive:read')
  list() {
    return this.preventive.list();
  }

  @Get(':id')
  @RequirePermission('preventive:read')
  get(@Param('id') id: string) {
    return this.preventive.get(id);
  }

  @Post()
  @RequirePermission('preventive:create')
  create(@Body() dto: CreatePreventiveDto) {
    return this.preventive.create(dto);
  }

  @Patch(':id')
  @RequirePermission('preventive:update')
  update(@Param('id') id: string, @Body() dto: UpdatePreventiveDto) {
    return this.preventive.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('preventive:delete')
  remove(@Param('id') id: string) {
    return this.preventive.remove(id);
  }
}
