import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';

type SystemStatus = {
  code: string;
  name: string;
  color: string;
  sortOrder: number;
  isInitial?: boolean;
  isFinal?: boolean;
};

const REQUIRED_SYSTEM_STATUSES: SystemStatus[] = [
  { code: 'chequeo', name: 'Chequeo', color: '#94A3B8', sortOrder: 10, isInitial: true },
  { code: 'sin_estado', name: 'Sin estado', color: '#94A3B8', sortOrder: 11 },
  { code: 'esperando_repuesto', name: 'Esperando repuesto', color: '#F97316', sortOrder: 20 },
  { code: 'esperando_respuesta', name: 'Esperando respuesta', color: '#F59E0B', sortOrder: 21 },
  { code: 'reparacion', name: 'Reparación', color: '#6366F1', sortOrder: 22 },
  { code: 'cambio', name: 'Cambio', color: '#14B8A6', sortOrder: 30 },
  { code: 'instalado', name: 'Instalado', color: '#10B981', sortOrder: 31 },
  { code: 'no_presento_falla', name: 'No presentó falla', color: '#F59E0B', sortOrder: 32 },
  { code: 'no_reparado', name: 'No reparado', color: '#EF4444', sortOrder: 33, isFinal: true },
  { code: 'reparado', name: 'Reparado', color: '#22C55E', sortOrder: 34, isFinal: true },
  { code: 'retenido', name: 'Retenido', color: '#A855F7', sortOrder: 35 },
  { code: 'sin_solucion', name: 'Sin solución', color: '#64748B', sortOrder: 36, isFinal: true },
];

@Injectable()
export class WorkOrderStatusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  private async ensureRequiredStatuses(tenantId: string) {
    const existing = await this.prisma.workOrderStatus.findMany({
      where: { tenantId },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((s) => s.code));
    const missing = REQUIRED_SYSTEM_STATUSES.filter((status) => !existingCodes.has(status.code));
    if (!missing.length) return;

    await this.prisma.workOrderStatus.createMany({
      data: missing.map((status) => ({
        tenantId,
        code: status.code,
        name: status.name,
        color: status.color,
        sortOrder: status.sortOrder,
        isInitial: status.isInitial ?? false,
        isFinal: status.isFinal ?? false,
        isSystem: true,
      })),
      skipDuplicates: true,
    });
  }

  async list(tenantIdFromUser?: string | null) {
    const tenantId = tenantIdFromUser || this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');

    await this.ensureRequiredStatuses(tenantId);

    return this.prisma.workOrderStatus.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
