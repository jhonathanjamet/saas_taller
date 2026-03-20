import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  create(dto: CreateSupplierDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.supplier.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.prisma.supplier.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.supplier.updateMany({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }
}
