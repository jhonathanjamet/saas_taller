import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  create(dto: CreateProductDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.product.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.prisma.product.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.product.updateMany({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }
}
