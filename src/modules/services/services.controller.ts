import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermission('services:read')
  list() {
    return this.services.list();
  }

  @Get(':id')
  @RequirePermission('services:read')
  get(@Param('id') id: string) {
    return this.services.get(id);
  }

  @Post()
  @RequirePermission('services:create')
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Patch(':id')
  @RequirePermission('services:update')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('services:delete')
  remove(@Param('id') id: string) {
    return this.services.remove(id);
  }
}
