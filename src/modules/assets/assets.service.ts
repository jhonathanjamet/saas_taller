import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Activo no encontrado');
    return asset;
  }

  create(dto: CreateAssetDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.asset.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.prisma.asset.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.asset.updateMany({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id };
  }
}
