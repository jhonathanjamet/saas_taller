import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequirePermission('inventory:read')
  list() {
    return this.inventory.list();
  }

  @Get('product/:productId')
  @RequirePermission('inventory:read')
  byProduct(@Param('productId') productId: string) {
    return this.inventory.byProduct(productId);
  }

  @Post('adjust')
  @RequirePermission('inventory:adjust')
  adjust(@Body() dto: AdjustInventoryDto) {
    return this.inventory.adjust(dto);
  }
}
