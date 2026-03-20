import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const byStatus = await this.prisma.workOrder.groupBy({
      by: ['statusId'],
      _count: { _all: true },
      where: { deletedAt: null },
    });

    const statuses = await this.prisma.workOrderStatus.findMany();
    const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

    return byStatus.map((row) => ({
      statusId: row.statusId,
      statusName: statusMap.get(row.statusId) || 'Desconocido',
      total: row._count._all,
    }));
  }
}
