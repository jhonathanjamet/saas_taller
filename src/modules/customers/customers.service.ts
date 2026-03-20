import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  create(dto: CreateCustomerDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.customer.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.prisma.customer.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.customer.updateMany({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }
}
