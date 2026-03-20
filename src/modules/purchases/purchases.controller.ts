import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  @RequirePermission('purchases:read')
  list() {
    return this.purchases.list();
  }

  @Get(':id')
  @RequirePermission('purchases:read')
  get(@Param('id') id: string) {
    return this.purchases.get(id);
  }

  @Post()
  @RequirePermission('purchases:create')
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchases.create(dto);
  }

  @Patch(':id')
  @RequirePermission('purchases:update')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchases.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchases:delete')
  remove(@Param('id') id: string) {
    return this.purchases.remove(id);
  }
}
