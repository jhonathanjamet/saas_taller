import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.branch.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  create(dto: CreateBranchDto) {
    const { taxRate, ...rest } = dto as any;
    const settings = taxRate !== undefined ? { ...(rest.settings || {}), taxRate } : rest.settings;
    return this.prisma.branch.create({ data: { ...rest, settings } });
  }

  async update(id: string, dto: UpdateBranchDto) {
    const { taxRate, ...rest } = dto as any;
    const current = await this.prisma.branch.findFirst({ where: { id }, select: { settings: true } });
    const mergedSettings =
      taxRate !== undefined
        ? { ...(current?.settings as any), ...(rest.settings || {}), taxRate }
        : rest.settings ?? current?.settings;
    await this.prisma.branch.updateMany({
      where: { id },
      data: { ...rest, settings: mergedSettings },
    });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.branch.updateMany({ where: { id }, data: { isActive: false } });
    return { id };
  }
}
