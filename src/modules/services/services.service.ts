import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  create(dto: CreateServiceDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.service.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.prisma.service.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.service.updateMany({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }
}
