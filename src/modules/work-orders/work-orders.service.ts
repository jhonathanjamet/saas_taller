import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { Prisma, WorkOrderPriority, WorkOrderTaskStatus } from '@prisma/client';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

type ActorContext = {
  userId?: string | null;
  tenantId?: string | null;
};

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  private asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private isUuidDataError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    const message = String((error as { message?: string }).message || '');
    return code === 'P2023' || message.toLowerCase().includes('error creating uuid');
  }

  private async listViaSql(tenantId: string | undefined, history: boolean) {
    const where: string[] = ['wo.deleted_at IS NULL'];
    const params: Array<string> = [];

    if (history) {
      where.push('wo.delivered_at IS NOT NULL');
    } else {
      where.push('wo.delivered_at IS NULL');
    }

    if (tenantId) {
      params.push(tenantId);
      where.push(`wo.tenant_id::text = $${params.length}`);
    }

    const orderBy = history ? 'wo.delivered_at DESC' : 'wo.created_at DESC';
    const sql = `
      SELECT
        wo.id::text AS id,
        wo.order_number AS "orderNumber",
        wo.customer_id::text AS "customerId",
        wo.asset_id::text AS "assetId",
        wo.status_id::text AS "statusId",
        wo.order_type AS "orderType",
        wo.priority::text AS priority,
        wo.internal_notes AS "internalNotes",
        wo.initial_diagnosis AS "initialDiagnosis",
        wo.technical_diagnosis AS "technicalDiagnosis",
        wo.client_notes AS "clientNotes",
        wo.total_amount AS "totalAmount",
        wo.delivered_at AS "deliveredAt",
        wos.id::text AS "statusIdJoin",
        wos.name AS "statusNameJoin",
        wos.code AS "statusCodeJoin"
      FROM work_order wo
      LEFT JOIN work_order_status wos ON wos.id::text = wo.status_id::text
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
    `;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        orderNumber: string;
        customerId: string;
        assetId: string | null;
        statusId: string;
        orderType: string | null;
        priority: string | null;
        internalNotes: string | null;
        initialDiagnosis: string | null;
        technicalDiagnosis: string | null;
        clientNotes: string | null;
        totalAmount: Prisma.Decimal | number | null;
        deliveredAt: Date | null;
        statusIdJoin: string | null;
        statusNameJoin: string | null;
        statusCodeJoin: string | null;
      }>
    >(sql, ...params);

    return rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      assetId: row.assetId,
      statusId: row.statusId,
      orderType: row.orderType,
      priority: row.priority,
      internalNotes: row.internalNotes,
      initialDiagnosis: row.initialDiagnosis,
      technicalDiagnosis: row.technicalDiagnosis,
      clientNotes: row.clientNotes,
      totalAmount:
        row.totalAmount instanceof Prisma.Decimal
          ? Number(row.totalAmount)
          : (row.totalAmount ?? null),
      deliveredAt: row.deliveredAt,
      status: row.statusIdJoin
        ? {
            id: row.statusIdJoin,
            name: row.statusNameJoin || row.statusCodeJoin || 'Sin estado',
            code: row.statusCodeJoin,
          }
        : null,
    }));
  }

  private async getViaSql(id: string, tenantId?: string) {
    const where: string[] = ['wo.id::text = $1', 'wo.deleted_at IS NULL'];
    const params: Array<string> = [id];
    if (tenantId) {
      params.push(tenantId);
      where.push(`wo.tenant_id::text = $${params.length}`);
    }

    const sql = `
      SELECT
        wo.id::text AS id,
        wo.tenant_id::text AS "tenantId",
        wo.branch_id::text AS "branchId",
        wo.order_number AS "orderNumber",
        wo.customer_id::text AS "customerId",
        wo.asset_id::text AS "assetId",
        wo.status_id::text AS "statusId",
        wo.priority::text AS priority,
        wo.order_type AS "orderType",
        wo.internal_notes AS "internalNotes",
        wo.initial_diagnosis AS "initialDiagnosis",
        wo.technical_diagnosis AS "technicalDiagnosis",
        wo.client_notes AS "clientNotes",
        wo.quote_approved AS "quoteApproved",
        wo.received_at AS "receivedAt",
        wo.promised_at AS "promisedAt",
        wo.subtotal_products AS "subtotalProducts",
        wo.subtotal_services AS "subtotalServices",
        wo.discount_amount AS "discountAmount",
        wo.tax_amount AS "taxAmount",
        wo.total_amount AS "totalAmount",
        wo.internal_cost AS "internalCost",
        wo.delivered_at AS "deliveredAt",
        wo.created_at AS "createdAt",
        wo.updated_at AS "updatedAt"
      FROM work_order wo
      WHERE ${where.join(' AND ')}
      LIMIT 1
    `;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        tenantId: string;
        branchId: string;
        orderNumber: string;
        customerId: string;
        assetId: string | null;
        statusId: string;
        priority: string | null;
        orderType: string | null;
        internalNotes: string | null;
        initialDiagnosis: string | null;
        technicalDiagnosis: string | null;
        clientNotes: string | null;
        quoteApproved: boolean | null;
        receivedAt: Date | null;
        promisedAt: Date | null;
        subtotalProducts: Prisma.Decimal | number | null;
        subtotalServices: Prisma.Decimal | number | null;
        discountAmount: Prisma.Decimal | number | null;
        taxAmount: Prisma.Decimal | number | null;
        totalAmount: Prisma.Decimal | number | null;
        internalCost: Prisma.Decimal | number | null;
        deliveredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(sql, ...params);

    if (!rows.length) return null;
    const row = rows[0];
    const asNumber = (value: Prisma.Decimal | number | null) =>
      value instanceof Prisma.Decimal ? Number(value) : (value ?? 0);

    return {
      id: row.id,
      tenantId: row.tenantId,
      branchId: row.branchId,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      assetId: row.assetId,
      statusId: row.statusId,
      priority: row.priority,
      orderType: row.orderType,
      internalNotes: row.internalNotes,
      initialDiagnosis: row.initialDiagnosis,
      technicalDiagnosis: row.technicalDiagnosis,
      clientNotes: row.clientNotes,
      quoteApproved: row.quoteApproved ?? false,
      receivedAt: row.receivedAt,
      promisedAt: row.promisedAt,
      subtotalProducts: asNumber(row.subtotalProducts),
      subtotalServices: asNumber(row.subtotalServices),
      discountAmount: asNumber(row.discountAmount),
      taxAmount: asNumber(row.taxAmount),
      totalAmount: asNumber(row.totalAmount),
      internalCost: asNumber(row.internalCost),
      deliveredAt: row.deliveredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async updateViaSql(
    id: string,
    dto: UpdateWorkOrderDto,
    tenantId?: string,
  ): Promise<void> {
    const where: string[] = ['id::text = $1', 'deleted_at IS NULL'];
    const params: Array<string | number | boolean | Date | null> = [id];
    if (tenantId) {
      params.push(tenantId);
      where.push(`tenant_id::text = $${params.length}`);
    }

    const setParts: string[] = [];
    const addSet = (column: string, value: string | number | boolean | Date | null) => {
      params.push(value);
      setParts.push(`${column} = $${params.length}`);
    };

    if (dto.orderNumber !== undefined) addSet('order_number', dto.orderNumber);
    if (dto.branchId !== undefined) addSet('branch_id', dto.branchId);
    if (dto.customerId !== undefined) addSet('customer_id', dto.customerId);
    if (dto.assetId !== undefined) addSet('asset_id', dto.assetId);
    if (dto.statusId !== undefined) addSet('status_id', dto.statusId);
    if (dto.priority !== undefined) addSet('priority', dto.priority);
    if (dto.orderType !== undefined) addSet('order_type', dto.orderType);
    if (dto.channel !== undefined) addSet('channel', dto.channel);
    if (dto.initialDiagnosis !== undefined) addSet('initial_diagnosis', dto.initialDiagnosis);
    if (dto.technicalDiagnosis !== undefined) addSet('technical_diagnosis', dto.technicalDiagnosis);
    if (dto.clientNotes !== undefined) addSet('client_notes', dto.clientNotes);
    if (dto.internalNotes !== undefined) addSet('internal_notes', dto.internalNotes);
    if (dto.warrantyTerms !== undefined) addSet('warranty_terms', dto.warrantyTerms);
    if (dto.promisedAt !== undefined) {
      addSet('promised_at', dto.promisedAt ? new Date(dto.promisedAt) : null);
    }
    if (dto.discountAmount !== undefined) addSet('discount_amount', dto.discountAmount);
    if (dto.quoteApproved !== undefined) {
      addSet('quote_approved', dto.quoteApproved);
      addSet('quote_approved_at', dto.quoteApproved ? new Date() : null);
    }

    if (!setParts.length) return;
    setParts.push('updated_at = NOW()');

    const sql = `UPDATE work_order SET ${setParts.join(', ')} WHERE ${where.join(' AND ')}`;
    const affected = await this.prisma.$executeRawUnsafe(sql, ...params);
    if (!affected) {
      throw new NotFoundException('OT no encontrada');
    }
  }

  async list() {
    const tenantId = this.context.getTenantId();
    try {
      return await this.prisma.workOrder.findMany({
        where: { deletedAt: null, deliveredAt: null, ...(tenantId ? { tenantId } : {}) },
        select: {
          id: true,
          orderNumber: true,
          customerId: true,
          assetId: true,
          statusId: true,
          orderType: true,
          priority: true,
          internalNotes: true,
          initialDiagnosis: true,
          technicalDiagnosis: true,
          clientNotes: true,
          totalAmount: true,
          deliveredAt: true,
          status: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('list() falló con Prisma ORM', error instanceof Error ? error.stack : String(error));
      try {
        return await this.listViaSql(tenantId, false);
      } catch (fallbackError) {
        this.logger.error(
          'list() falló también con SQL fallback',
          fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
        );
        return [];
      }
    }
  }

  async history() {
    const tenantId = this.context.getTenantId();
    try {
      return await this.prisma.workOrder.findMany({
        where: { deletedAt: null, deliveredAt: { not: null }, ...(tenantId ? { tenantId } : {}) },
        select: {
          id: true,
          orderNumber: true,
          customerId: true,
          assetId: true,
          statusId: true,
          orderType: true,
          priority: true,
          internalNotes: true,
          initialDiagnosis: true,
          technicalDiagnosis: true,
          clientNotes: true,
          totalAmount: true,
          deliveredAt: true,
          status: { select: { id: true, name: true, code: true } },
        },
        orderBy: { deliveredAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        'history() falló con Prisma ORM',
        error instanceof Error ? error.stack : String(error),
      );
      try {
        return await this.listViaSql(tenantId, true);
      } catch (fallbackError) {
        this.logger.error(
          'history() falló también con SQL fallback',
          fallbackError instanceof Error ? fallbackError.stack : String(fallbackError),
        );
        return [];
      }
    }
  }

  async get(id: string) {
    const tenantId = this.context.getTenantId();
    let workOrder: any = null;
    try {
      workOrder = await this.prisma.workOrder.findFirst({
        where: { id, deletedAt: null, ...(tenantId ? { tenantId } : {}) },
      });
    } catch (error) {
      this.logger.error(
        `get(${id}) falló con Prisma ORM`,
        error instanceof Error ? error.stack : String(error),
      );
      workOrder = await this.getViaSql(id, tenantId);
    }
    if (!workOrder) throw new NotFoundException('OT no encontrada');
    return workOrder;
  }

  async comments(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    return this.prisma.workOrderComment.findMany({
      where: { workOrderId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(
    id: string,
    dto: { content: string; isInternal?: boolean; kind?: string },
    actor: ActorContext = {},
  ) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true, createdBy: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    const content =
      dto.kind === 'diagnostic' ? `[DX] ${dto.content.trim()}` : dto.content.trim();
    const userId = actor.userId || this.context.getUserId() || workOrder.createdBy || undefined;
    const tenantId = actor.tenantId || this.context.getTenantId() || workOrder.tenantId;
    if (!userId) throw new BadRequestException('Usuario requerido');
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.workOrderComment.create({
      data: {
        tenantId,
        workOrderId: id,
        content,
        isInternal: dto.isInternal ?? false,
        userId,
      } as any,
    });
  }

  async updateComment(id: string, commentId: string, dto: { content?: string; isInternal?: boolean }) {
    const existing = await this.prisma.workOrderComment.findFirst({
      where: { id: commentId, workOrderId: id },
    });
    if (!existing) throw new NotFoundException('Comentario no encontrado');

    return this.prisma.workOrderComment.update({
      where: { id: commentId },
      data: {
        ...(dto.content ? { content: dto.content } : {}),
        ...(dto.isInternal !== undefined ? { isInternal: dto.isInternal } : {}),
      },
    });
  }

  async removeComment(id: string, commentId: string) {
    const existing = await this.prisma.workOrderComment.findFirst({
      where: { id: commentId, workOrderId: id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Comentario no encontrado');
    await this.prisma.workOrderComment.delete({ where: { id: commentId } });
    return { id: commentId };
  }

  async tasks(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    return this.prisma.workOrderTask.findMany({
      where: { workOrderId: id },
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addTask(id: string, dto: { title: string; description?: string }, actor: ActorContext = {}) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    const tenantId = actor.tenantId || this.context.getTenantId() || workOrder.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.workOrderTask.create({
      data: {
        tenantId,
        workOrderId: id,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async updateTask(
    id: string,
    taskId: string,
    dto: { title?: string; description?: string; status?: WorkOrderTaskStatus },
  ) {
    const existing = await this.prisma.workOrderTask.findFirst({
      where: { id: taskId, workOrderId: id },
    });
    if (!existing) throw new NotFoundException('Tarea no encontrada');

    return this.prisma.workOrderTask.update({
      where: { id: taskId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async removeTask(id: string, taskId: string) {
    const existing = await this.prisma.workOrderTask.findFirst({
      where: { id: taskId, workOrderId: id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Tarea no encontrada');
    await this.prisma.workOrderTask.delete({ where: { id: taskId } });
    return { id: taskId };
  }

  async items(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    return this.prisma.workOrderItem.findMany({
      where: { workOrderId: id },
      include: {
        product: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private computeTotals(
    items: Array<{ itemType: string; totalPrice: number; totalCost: number }>,
    discountAmount: number,
    taxRate: number,
  ) {
    const subtotalProducts = items
      .filter((i) => i.itemType === 'product')
      .reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    const subtotalServices = items
      .filter((i) => i.itemType === 'service')
      .reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    const subtotalAdditional = items
      .filter((i) => i.itemType === 'additional')
      .reduce((acc, item) => acc + (item.totalPrice || 0), 0);
    const internalCost = items.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const subtotal = subtotalProducts + subtotalServices + subtotalAdditional;
    const discount = Math.max(0, Number(discountAmount || 0));
    const taxable = Math.max(0, subtotal - discount);
    const rate = Number.isFinite(taxRate) && taxRate > 0 ? taxRate : 0;
    const taxAmount = Math.round(taxable * rate);
    const totalAmount = taxable + taxAmount;
    return {
      subtotalProducts,
      subtotalServices,
      totalAmount,
      internalCost,
      discountAmount: discount,
      taxAmount,
    };
  }

  private calcTotalsForItem(input: {
    quantity: number;
    unitCost: number;
    unitPrice: number;
    discountPercent?: number | null;
  }) {
    const qty = Number(input.quantity || 0);
    const unitCost = Number(input.unitCost || 0);
    const unitPrice = Number(input.unitPrice || 0);
    const discount = Number(input.discountPercent || 0);
    const totalCost = qty * unitCost;
    const totalPrice = qty * unitPrice * (1 - discount / 100);
    return { totalCost, totalPrice };
  }

  private async recomputeAndPersistOrderTotals(workOrderId: string) {
    try {
      const items = await this.prisma.workOrderItem.findMany({ where: { workOrderId } });
      const order = await this.prisma.workOrder.findFirst({
        where: { id: workOrderId },
        select: { discountAmount: true },
      });
      const taxRate = await this.resolveTaxRate(workOrderId);
      const aggregates = this.computeTotals(
        items.map((item) => ({
          itemType: item.itemType,
          totalPrice: Number(item.totalPrice || 0),
          totalCost: Number(item.totalCost || 0),
        })),
        Number(order?.discountAmount || 0),
        taxRate,
      );
      await this.prisma.workOrder.updateMany({
        where: { id: workOrderId },
        data: aggregates,
      });
    } catch (error: any) {
      // No bloqueamos el guardado de ítems si el recálculo falla.
      // El usuario debe poder seguir operando y luego forzar recálculo global.
      console.error('[work-orders] No se pudo recalcular totales de OT', {
        workOrderId,
        message: error?.message || String(error),
      });
    }
  }

  private async resolveTaxRate(id: string) {
    void id;
    // Regla operativa solicitada: no aplicar IVA global automático a la OT.
    // El IVA se refleja solo cuando el usuario lo ingresa manualmente en el ítem.
    return 0;
  }

  async addItem(
    id: string,
    dto: {
      itemType: 'product' | 'service' | 'additional';
      productId?: string;
      serviceId?: string;
      description?: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      discountPercent?: number;
    },
    actor: ActorContext = {},
  ) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!workOrder) throw new NotFoundException('OT no encontrada');

    if (dto.itemType === 'product' && !dto.productId && !dto.description) {
      throw new BadRequestException('Producto o descripción requerida');
    }
    if (dto.itemType === 'service' && !dto.serviceId && !dto.description) {
      throw new BadRequestException('Servicio o descripción requerida');
    }
    if (dto.itemType === 'additional' && !dto.description) {
      throw new BadRequestException('Descripción requerida para adicional');
    }

    const totals = this.calcTotalsForItem(dto);
    const tenantId = actor.tenantId || this.context.getTenantId() || workOrder.tenantId;
    const userId = actor.userId || this.context.getUserId() || undefined;
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    const created = await this.prisma.workOrderItem.create({
      data: {
        tenantId,
        workOrderId: id,
        itemType: dto.itemType,
        productId: dto.productId,
        serviceId: dto.serviceId,
        description: dto.description,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        unitPrice: dto.unitPrice,
        discountPercent: dto.discountPercent || 0,
        totalCost: totals.totalCost,
        totalPrice: totals.totalPrice,
        addedBy: userId,
      },
    });

    await this.recomputeAndPersistOrderTotals(id);

    return created;
  }

  async updateItem(
    id: string,
    itemId: string,
    dto: {
      productId?: string;
      serviceId?: string;
      description?: string;
      quantity?: number;
      unitCost?: number;
      unitPrice?: number;
      discountPercent?: number;
    },
  ) {
    const existing = await this.prisma.workOrderItem.findFirst({
      where: { id: itemId, workOrderId: id },
    });
    if (!existing) throw new NotFoundException('Ítem no encontrado');

    const totals = this.calcTotalsForItem({
      quantity: dto.quantity ?? Number(existing.quantity),
      unitCost: dto.unitCost ?? Number(existing.unitCost),
      unitPrice: dto.unitPrice ?? Number(existing.unitPrice),
      discountPercent: dto.discountPercent ?? Number(existing.discountPercent),
    });

    const updated = await this.prisma.workOrderItem.update({
      where: { id: itemId },
      data: {
        ...(dto.productId !== undefined ? { productId: dto.productId } : {}),
        ...(dto.serviceId !== undefined ? { serviceId: dto.serviceId } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.unitCost !== undefined ? { unitCost: dto.unitCost } : {}),
        ...(dto.unitPrice !== undefined ? { unitPrice: dto.unitPrice } : {}),
        ...(dto.discountPercent !== undefined ? { discountPercent: dto.discountPercent } : {}),
        totalCost: totals.totalCost,
        totalPrice: totals.totalPrice,
      },
    });

    await this.recomputeAndPersistOrderTotals(id);

    return updated;
  }

  async removeItem(id: string, itemId: string) {
    const existing = await this.prisma.workOrderItem.findFirst({
      where: { id: itemId, workOrderId: id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Ítem no encontrado');

    await this.prisma.workOrderItem.delete({ where: { id: itemId } });

    await this.recomputeAndPersistOrderTotals(id);

    return { id: itemId };
  }

  create(dto: CreateWorkOrderDto, actor: ActorContext = {}) {
    const tenantId = actor.tenantId || this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.$transaction(async (tx) => {
      let orderNumber = dto.orderNumber?.trim();
      if (!orderNumber) {
        const tenant = await tx.tenant.findFirst({
          where: { id: tenantId },
          select: { settings: true },
        });
        const settings = this.asObject(tenant?.settings);
        const workshopConfig = this.asObject(settings.workshopConfig as Prisma.JsonValue);
        const configuredNext = Number((workshopConfig.proximaOrden as string) || 0);

        const existing = await tx.workOrder.findMany({
          where: { tenantId, branchId: dto.branchId },
          select: { orderNumber: true },
        });
        let maxNumber = 0;
        for (const item of existing) {
          const digits = item.orderNumber?.match(/\d+/g)?.join('') || '';
          const value = Number(digits);
          if (Number.isFinite(value) && value > maxNumber) {
            maxNumber = value;
          }
        }
        const nextNumber = Math.max(maxNumber + 1, Number.isFinite(configuredNext) ? configuredNext : 1);
        orderNumber = String(nextNumber);

        const mergedWorkshopConfig = {
          ...workshopConfig,
          proximaOrden: String(nextNumber + 1),
        };
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            settings: {
              ...settings,
              workshopConfig: mergedWorkshopConfig,
            } as any,
          },
        });
      }

      return tx.workOrder.create({
        data: {
          ...dto,
          priority: dto.priority as WorkOrderPriority | undefined,
          tenantId,
          orderNumber,
        },
      });
    });
  }

  async update(id: string, dto: UpdateWorkOrderDto, actor: ActorContext = {}) {
    const tenantId = actor.tenantId || this.context.getTenantId() || undefined;
    const existing = await this.getViaSql(id, tenantId);
    if (!existing) throw new NotFoundException('OT no encontrada');

    await this.updateViaSql(id, dto, tenantId);

    if (dto.discountAmount !== undefined) {
      try {
        const items = await this.prisma.workOrderItem.findMany({
          where: { workOrderId: existing.id },
        });
        const taxRate = await this.resolveTaxRate(existing.id);
        const aggregates = this.computeTotals(
          items.map((item) => ({
            itemType: item.itemType,
            totalPrice: Number(item.totalPrice || 0),
            totalCost: Number(item.totalCost || 0),
          })),
          Number(dto.discountAmount || 0),
          taxRate,
        );
        await this.prisma.workOrder.updateMany({
          where: { id: existing.id, ...(tenantId ? { tenantId } : {}) },
          data: aggregates,
        });
      } catch (error) {
        this.logger.warn(
          `update() no pudo recalcular totales OT ${existing.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const refreshed = await this.getViaSql(existing.id, tenantId);
    if (!refreshed) throw new NotFoundException('OT no encontrada');
    return refreshed;
  }

  async remove(id: string, actor: ActorContext = {}) {
    const tenantId = actor.tenantId || this.context.getTenantId();
    const userId = actor.userId || this.context.getUserId();
    if (!tenantId || !userId) {
      throw new BadRequestException('Contexto inválido');
    }
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = this.asObject(tenant?.settings);
    const workshopConfig = this.asObject(settings.workshopConfig as Prisma.JsonValue);
    const deletionMode = String(workshopConfig.eliminacionOrdenes || 'todos');

    if (deletionMode === 'nadie') {
      throw new BadRequestException('La eliminación de órdenes está deshabilitada');
    }
    if (deletionMode === 'solo_admin') {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        include: { role: { select: { code: true, name: true } } },
      });
      const roleCode = (user?.role?.code || '').toLowerCase();
      const roleName = (user?.role?.name || '').toLowerCase();
      const isAdmin =
        roleCode.includes('admin') ||
        roleCode.includes('owner') ||
        roleName.includes('admin') ||
        roleName.includes('due') ||
        roleName.includes('owner');
      if (!isAdmin) {
        throw new BadRequestException('Solo administradores pueden eliminar órdenes');
      }
    }

    await this.prisma.workOrder.updateMany({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async deliver(id: string, actor: ActorContext = {}) {
    const tenantId = actor.tenantId || this.context.getTenantId();
    const userId = actor.userId || this.context.getUserId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');

    const existing = await this.prisma.workOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, orderNumber: true, deliveredAt: true },
    });
    if (!existing) throw new NotFoundException('OT no encontrada');

    if (existing.deliveredAt) {
      return { id: existing.id, deliveredAt: existing.deliveredAt, alreadyDelivered: true };
    }

    const deliveredAt = new Date();
    await this.prisma.workOrder.updateMany({
      where: { id: existing.id },
      data: {
        deliveredAt,
        completedAt: deliveredAt,
        orderType: 'salida',
        ...(userId ? { updatedBy: userId } : {}),
      },
    });

    if (userId) {
      await this.prisma.workOrderComment.create({
        data: {
          tenantId,
          workOrderId: existing.id,
          userId,
          isInternal: true,
          content: `Orden entregada al cliente (${existing.orderNumber})`,
        } as any,
      });
    }

    return { id: existing.id, deliveredAt, delivered: true };
  }

  async getPublicByOrderNumber(orderNumber: string) {
    const raw = (orderNumber || '').trim();
    const digits = raw.match(/\d+/g)?.join('') || '';
    const candidates = Array.from(
      new Set(
        [raw, digits, `IMP-${digits}`].filter((v) => v && v.length > 0),
      ),
    );

    const where = digits
      ? {
          deletedAt: null,
          OR: [
            { orderNumber: { in: candidates } },
            { orderNumber: { endsWith: digits } },
          ],
        }
      : {
          deletedAt: null,
          orderNumber: raw,
        };

    const workOrder = await this.prisma.workOrder.findFirst({
      where: where as any,
      include: {
        branch: { select: { id: true, name: true, phone: true, settings: true } },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalName: true,
            phone: true,
            email: true,
            taxId: true,
          },
        },
        asset: {
          select: {
            id: true,
            brand: true,
            model: true,
            serialNumber: true,
            assetType: { select: { name: true } },
          },
        },
        status: { select: { id: true, name: true, code: true } },
        items: {
          select: {
            id: true,
            itemType: true,
            description: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            product: { select: { name: true } },
            service: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workOrder) throw new NotFoundException('OT no encontrada');

    const comments = await this.prisma.workOrderComment.findMany({
      where: {
        workOrderId: workOrder.id,
        isInternal: false,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const files = await this.prisma.fileAttachment.findMany({
      where: {
        entityType: 'work_order',
        entityId: workOrder.id,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        mimeType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const photos = await this.prisma.workOrderPhoto.findMany({
      where: {
        workOrderId: workOrder.id,
        isVisibleToClient: true,
      },
      select: {
        id: true,
        fileUrl: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const attachments = [
      ...photos.map((photo) => ({
        id: photo.id,
        fileName: photo.description || 'Imagen de orden',
        fileUrl: photo.fileUrl,
        mimeType: 'image/*' as string,
      })),
      ...files,
    ].filter((item, index, array) => array.findIndex((x) => x.fileUrl === item.fileUrl) === index);

    const branchSettings = (workOrder.branch?.settings || {}) as Record<string, any>;
    const termsAndConditions =
      branchSettings.termsAndConditions ||
      branchSettings.terms ||
      'Para retirar el equipo es indispensable presentar esta orden de trabajo. El equipo debe ser retirado dentro de 30 días.';

    return {
      id: workOrder.id,
      orderNumber: workOrder.orderNumber,
      createdAt: workOrder.createdAt,
      promisedAt: workOrder.promisedAt,
      priority: workOrder.priority,
      orderType: workOrder.orderType,
      status: workOrder.status,
      initialDiagnosis: workOrder.initialDiagnosis,
      technicalDiagnosis: workOrder.technicalDiagnosis,
      clientNotes: workOrder.clientNotes,
      totalAmount: Number(workOrder.totalAmount || 0),
      discountAmount: Number(workOrder.discountAmount || 0),
      taxAmount: Number(workOrder.taxAmount || 0),
      subtotalProducts: Number(workOrder.subtotalProducts || 0),
      subtotalServices: Number(workOrder.subtotalServices || 0),
      quoteApproved: workOrder.quoteApproved,
      branch: workOrder.branch,
      customer: workOrder.customer,
      asset: {
        id: workOrder.asset?.id || null,
        brand: workOrder.asset?.brand || null,
        model: workOrder.asset?.model || null,
        serialNumber: workOrder.asset?.serialNumber || null,
        assetType: workOrder.asset?.assetType?.name || null,
      },
      items: workOrder.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description || item.product?.name || item.service?.name || 'Ítem',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        userName: [comment.user?.firstName, comment.user?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
      })),
      attachments,
      termsAndConditions,
    };
  }
}
