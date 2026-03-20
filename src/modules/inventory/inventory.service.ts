import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.inventory.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async adjust(dto: AdjustInventoryDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    const inventory = await this.prisma.inventory.findFirst({
      where: { tenantId, productId: dto.productId, branchId: dto.branchId },
    });

    const previousStock = Number(inventory?.quantity || 0);
    const newStock = previousStock + Number(dto.quantityDelta || 0);

    if (!inventory) {
      await this.prisma.inventory.create({
        data: {
          tenantId,
          productId: dto.productId,
          branchId: dto.branchId,
          quantity: newStock,
          reservedQuantity: 0,
        },
      });
    } else {
      await this.prisma.inventory.updateMany({
        where: { id: inventory.id },
        data: { quantity: newStock },
      });
    }

    await this.prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId: dto.productId,
        branchId: dto.branchId,
        type: 'adjustment',
        quantity: dto.quantityDelta,
        previousStock,
        newStock,
        reason: dto.reason || 'Ajuste manual',
      },
    });

    return { productId: dto.productId, branchId: dto.branchId, previousStock, newStock };
  }

  async byProduct(productId: string) {
    const inventory = await this.prisma.inventory.findMany({ where: { productId } });
    if (!inventory.length) throw new NotFoundException('Inventario no encontrado');
    return inventory;
  }
}
