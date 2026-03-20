import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeTaxRate(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0.19;
  return value > 1.5 ? value / 100 : value;
}

async function resolveTaxRate(branchId: string, tenantId: string) {
  const [branch, tenant] = await Promise.all([
    prisma.branch.findFirst({
      where: { id: branchId },
      select: { settings: true },
    }),
    prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true },
    }),
  ]);

  const branchRate = Number((branch?.settings as any)?.taxRate);
  if (Number.isFinite(branchRate) && branchRate > 0) return normalizeTaxRate(branchRate);

  const tenantRate = Number((tenant?.settings as any)?.taxRate);
  if (Number.isFinite(tenantRate) && tenantRate > 0) return normalizeTaxRate(tenantRate);

  return 0.19;
}

async function main() {
  const orders = await prisma.workOrder.findMany({
    where: { deletedAt: null },
    select: { id: true, branchId: true, tenantId: true, discountAmount: true },
  });

  let updated = 0;
  for (const order of orders) {
    const items = await prisma.workOrderItem.findMany({
      where: { workOrderId: order.id },
      select: { itemType: true, totalPrice: true, totalCost: true },
    });

    const subtotalProducts = items
      .filter((item) => item.itemType === 'product')
      .reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
    const subtotalServices = items
      .filter((item) => item.itemType === 'service')
      .reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
    const subtotalAdditional = items
      .filter((item) => item.itemType === 'additional')
      .reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);

    const internalCost = items.reduce((acc, item) => acc + Number(item.totalCost || 0), 0);
    const discountAmount = Number(order.discountAmount || 0);
    const taxable = Math.max(0, subtotalProducts + subtotalServices + subtotalAdditional - discountAmount);
    const taxRate = await resolveTaxRate(order.branchId, order.tenantId);
    const taxAmount = Math.round(taxable * taxRate);
    const totalAmount = taxable + taxAmount;

    await prisma.workOrder.update({
      where: { id: order.id },
      data: {
        subtotalProducts,
        subtotalServices,
        internalCost,
        taxAmount,
        totalAmount,
      },
    });
    updated += 1;
  }

  console.log(`Recalculo completado. Ordenes actualizadas: ${updated}`);
}

main()
  .catch((err) => {
    console.error('Error recalculando totales:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

