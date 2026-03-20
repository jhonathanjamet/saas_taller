import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

type UnknownRecord = Record<string, unknown>;

const prisma = new PrismaClient();

function digitsOnly(value: string) {
  const digits = value.match(/\d+/g)?.join('') || '';
  if (!digits) return '';
  const num = Number(digits);
  return Number.isFinite(num) ? String(num) : digits;
}

function getNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return fallback;
}

function getString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveTaxRate(workOrderId: string) {
  const order = await prisma.workOrder.findFirst({
    where: { id: workOrderId },
    select: { tenantId: true, branchId: true },
  });
  if (!order) return 0.19;
  const branch = await prisma.branch.findFirst({
    where: { id: order.branchId },
    select: { settings: true },
  });
  const tenant = await prisma.tenant.findFirst({
    where: { id: order.tenantId },
    select: { settings: true },
  });
  const normalize = (value: number) => (value > 1.5 ? value / 100 : value);
  const branchRate = Number((branch?.settings as any)?.taxRate);
  const tenantRate = Number((tenant?.settings as any)?.taxRate);
  if (Number.isFinite(branchRate) && branchRate > 0) return normalize(branchRate);
  if (Number.isFinite(tenantRate) && tenantRate > 0) return normalize(tenantRate);
  return 0.19;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Debes indicar la ruta del JSON. Ej: npm run import:gestioo:presupuesto:json -- /ruta/gestioo_comentarios.json');
    process.exit(1);
  }

  const clearExisting = process.env.CLEAR_EXISTING === '1';
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed?.datos?.orden
    ? [parsed.datos.orden]
    : (parsed?.datos || parsed?.data || []);

  const workOrders = await prisma.workOrder.findMany({
    select: { id: true, orderNumber: true },
  });
  const localMap = new Map(
    workOrders.map((o) => [digitsOnly(o.orderNumber), o.id]),
  );

  let created = 0;
  let skippedNoOrder = 0;
  let skippedExisting = 0;
  let updatedTotals = 0;

  for (const entry of entries as UnknownRecord[]) {
    const source: UnknownRecord =
      (entry as any)?.datos?.orden && typeof (entry as any).datos.orden === 'object'
        ? ((entry as any).datos.orden as UnknownRecord)
        : entry;

    const orderNumber = getString(source.numeracion || source.orderNumber || source.numero || source.nro);
    const workOrderId = localMap.get(digitsOnly(orderNumber));
    if (!workOrderId) {
      skippedNoOrder += 1;
      continue;
    }

    const orderRow = await prisma.workOrder.findFirst({
      where: { id: workOrderId },
      select: { tenantId: true },
    });
    if (!orderRow?.tenantId) {
      skippedNoOrder += 1;
      continue;
    }

    const existingCount = await prisma.workOrderItem.count({ where: { workOrderId } });
    if (existingCount > 0 && !clearExisting) {
      skippedExisting += 1;
      continue;
    }
    if (existingCount > 0 && clearExisting) {
      await prisma.workOrderItem.deleteMany({ where: { workOrderId } });
    }

    const items = Array.isArray(source.productos_servicios) ? source.productos_servicios : [];
    for (const item of items as UnknownRecord[]) {
      const servicioId = getNumber(item.servicio_id);
      const productoId = getNumber(item.producto_id);
      const itemType =
        servicioId > 0 ? 'service' : productoId > 0 ? 'product' : 'additional';
      const quantity = Math.max(1, getNumber(item.cantidad, 1));
      const importeOriginal = getNumber(item.importe_original, getNumber(item.importe, 0));
      const unitPrice = quantity > 0 ? importeOriginal / quantity : importeOriginal;
      const totalPrice = getNumber(item.importe, unitPrice * quantity);
      const unitCost = getNumber(item.costo, 0);
      const discountPercent = getNumber(item.descuento, getNumber(item.descuento_general, 0));
      const description = getString(item.descripcion) || getString(item.codigo) || 'Ítem';

      const productIdValue = productoId > 0 ? String(productoId) : '';
      const serviceIdValue = servicioId > 0 ? String(servicioId) : '';

      await prisma.workOrderItem.create({
        data: {
          tenantId: orderRow.tenantId,
          workOrderId,
          itemType,
          productId: isUuid(productIdValue) ? productIdValue : undefined,
          serviceId: isUuid(serviceIdValue) ? serviceIdValue : undefined,
          description,
          quantity,
          unitCost,
          unitPrice,
          discountPercent,
          totalCost: unitCost * quantity,
          totalPrice,
        } as any,
      });
      created += 1;
    }

    const subtotalProducts = items
      .filter((item: any) => Number(item.producto_id || 0) > 0)
      .reduce((acc: number, item: any) => acc + getNumber(item.importe, 0), 0);
    const subtotalServices = items
      .filter((item: any) => Number(item.servicio_id || 0) > 0)
      .reduce((acc: number, item: any) => acc + getNumber(item.importe, 0), 0);
    const subtotalAdditional = items
      .filter((item: any) => Number(item.producto_id || 0) <= 0 && Number(item.servicio_id || 0) <= 0)
      .reduce((acc: number, item: any) => acc + getNumber(item.importe, 0), 0);
    const descuentoImporte = getNumber(source.descuento_importe, getNumber((source as any)?.totales?.descuento_importe, 0));
    const taxAmount = getNumber((source as any)?.totales?.total_iva, getNumber(source.iva, 0));
    const totalAmount = getNumber((source as any)?.totales?.importe_total, getNumber(source.total, 0));

    const taxRate = await resolveTaxRate(workOrderId);
    const taxableBase = Math.max(0, subtotalProducts + subtotalServices + subtotalAdditional - descuentoImporte);
    const computedTaxAmount = taxAmount || Math.round(taxableBase * taxRate);
    const computedTotal = totalAmount || taxableBase + computedTaxAmount;

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        subtotalProducts,
        subtotalServices,
        discountAmount: descuentoImporte,
        taxAmount: computedTaxAmount,
        totalAmount: computedTotal,
      },
    });
    updatedTotals += 1;
  }

  console.log(
    `Importación completada. Ítems creados: ${created}. Órdenes actualizadas: ${updatedTotals}. Sin orden: ${skippedNoOrder}. Con ítems existentes: ${skippedExisting}.`,
  );
}

main()
  .catch((err) => {
    console.error('Error importando presupuesto:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
