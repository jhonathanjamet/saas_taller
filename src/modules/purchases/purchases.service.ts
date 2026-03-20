import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const purchase = await this.prisma.purchaseOrder.findFirst({ where: { id } });
    if (!purchase) throw new NotFoundException('Orden de compra no encontrada');
    return purchase;
  }

  create(dto: CreatePurchaseDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        orderNumber: dto.orderNumber,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        status: (dto.status as any) || 'draft',
      },
    });
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.prisma.purchaseOrder.updateMany({ where: { id }, data: dto as any });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.purchaseOrder.deleteMany({ where: { id } });
    return { id };
  }
}
