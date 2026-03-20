import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @RequirePermission('assets:read')
  list() {
    return this.assets.list();
  }

  @Get(':id')
  @RequirePermission('assets:read')
  get(@Param('id') id: string) {
    return this.assets.get(id);
  }

  @Post()
  @RequirePermission('assets:create')
  create(@Body() dto: CreateAssetDto) {
    return this.assets.create(dto);
  }

  @Patch(':id')
  @RequirePermission('assets:update')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assets.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('assets:delete')
  remove(@Param('id') id: string) {
    return this.assets.remove(id);
  }
}
