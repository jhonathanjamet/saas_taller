import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateWorkshopConfigDto } from './dto/update-workshop-config.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly workshopConfigDefaults = {
    tipoTaller: 'Ninguno de la lista',
    proximaOrden: '320',
    referenciaExterna: 'no_visible',
    tipoEquipo: 'visible',
    solicitarFirma: 'no',
    solicitarEncuesta: 'visible',
    tipoEncuesta: 'estrellas',
    textoLibre: 'permitido',
    correoCliente: 'ocultar',
    telefonoCliente: 'ocultar',
    eliminacionOrdenes: 'todos',
  };

  private asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  async getTenant(tenantId?: string) {
    if (!tenantId) throw new NotFoundException('Tenant no encontrado');
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async getWorkshopConfig(tenantId?: string) {
    const tenant = await this.getTenant(tenantId);
    const settings = this.asObject(tenant.settings);
    const current = this.asObject(settings.workshopConfig as Prisma.JsonValue);
    return { ...this.workshopConfigDefaults, ...current };
  }

  async updateWorkshopConfig(tenantId: string | undefined, dto: UpdateWorkshopConfigDto) {
    const tenant = await this.getTenant(tenantId);
    const currentSettings = this.asObject(tenant.settings);
    const currentWorkshopConfig = this.asObject(currentSettings.workshopConfig as Prisma.JsonValue);
    const workshopConfig = {
      ...this.workshopConfigDefaults,
      ...currentWorkshopConfig,
      ...dto,
    };

    const settings = {
      ...currentSettings,
      workshopConfig,
    };

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { settings },
    });

    return workshopConfig;
  }
}
