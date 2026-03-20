import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreatePreventiveDto } from './dto/create-preventive.dto';
import { UpdatePreventiveDto } from './dto/update-preventive.dto';

@Injectable()
export class PreventiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.preventivePlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const plan = await this.prisma.preventivePlan.findFirst({ where: { id } });
    if (!plan) throw new NotFoundException('Plan preventivo no encontrado');
    return plan;
  }

  create(dto: CreatePreventiveDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.preventivePlan.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        name: dto.name,
        frequencyType: dto.frequencyType as any,
        frequencyValue: dto.frequencyValue,
        alertBeforeValue: dto.alertBeforeValue,
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdatePreventiveDto) {
    await this.prisma.preventivePlan.updateMany({ where: { id }, data: dto as any });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.preventivePlan.updateMany({ where: { id }, data: { isActive: false } });
    return { id };
  }
}
