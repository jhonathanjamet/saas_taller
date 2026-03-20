#!/usr/bin/env ts-node
/**
 * ============================================================================
 * TallerHub — Script Principal de Migración desde Gestioo
 * ============================================================================
 * Importa datos CSV exportados desde Gestioo hacia la base de datos TallerHub.
 *
 * Uso:
 *   npm run migrate                    # Importar todo
 *   npm run migrate:customers          # Solo clientes
 *   npm run migrate -- --dry-run       # Solo validar, sin escribir en BD
 *   npm run validate                   # Solo validar CSVs
 *
 * Orden de importación:
 *   1. Clientes (customers)
 *   2. Activos (assets) — depende de clientes
 *   3. Productos (products)
 *   4. Órdenes de trabajo (orders) — depende de clientes, activos
 * ============================================================================
 */

import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { loadConfig, parseArgs, MigrationConfig } from './utils/config';
import { MigrationLogger } from './utils/logger';
import { parseCustomers, ParsedCustomer } from './parsers/customer-parser';
import { parseAssets, ParsedAsset } from './parsers/asset-parser';
import { parseProducts, ParsedProduct } from './parsers/product-parser';
import { parseOrders, ParsedOrder } from './parsers/order-parser';

// ─── Tipos auxiliares ──────────────────────────────────────

type EntityName = 'customers' | 'assets' | 'products' | 'orders';

const ENTITY_FILES: Record<EntityName, string> = {
  customers: 'clientes.csv',
  assets: 'activos.csv',
  products: 'productos.csv',
  orders: 'ordenes.csv',
};

// ─── Importadores a BD ────────────────────────────────────

async function importCustomers(
  prisma: PrismaClient,
  customers: ParsedCustomer[],
  logger: MigrationLogger
): Promise<Map<string, string>> {
  // Mapa: email|rut -> customerId (para resolver refs en assets/orders)
  const customerMap = new Map<string, string>();

  for (const c of customers) {
    try {
      const created = await prisma.customer.create({
        data: {
          id: c.id,
          tenantId: c.tenantId,
          type: c.type,
          firstName: c.firstName,
          lastName: c.lastName,
          legalName: c.legalName,
          taxId: c.taxId,
          email: c.email,
          phone: c.phone,
          secondaryPhone: c.secondaryPhone,
          address: c.address,
          city: c.city,
          state: c.state,
          notes: c.notes,
          source: c.source,
          isActive: c.isActive,
          createdBy: c.createdBy,
        },
      });

      if (c.email) customerMap.set(c.email.toLowerCase(), created.id);
      if (c.taxId) customerMap.set(c.taxId, created.id);
      customerMap.set(`name:${c.firstName} ${c.lastName || ''}`.trim(), created.id);

      logger.debug(`Cliente creado: ${c.firstName} ${c.lastName || ''} (${created.id})`);
    } catch (err: any) {
      logger.error(`Error creando cliente ${c.firstName}: ${err.message}`);
    }
  }

  return customerMap;
}

async function importAssets(
  prisma: PrismaClient,
  assets: ParsedAsset[],
  customerMap: Map<string, string>,
  config: MigrationConfig,
  logger: MigrationLogger
): Promise<Map<string, string>> {
  // Mapa: serial|patente -> assetId
  const assetMap = new Map<string, string>();

  // Obtener tipos de activos del tenant para mapear
  const assetTypes = await prisma.assetType.findMany({
    where: { tenantId: config.tenantId },
  });
  const typeMap = new Map<string, string>(assetTypes.map((t: any) => [t.name.toLowerCase(), t.id]));

  for (const a of assets) {
    try {
      // Resolver customerId
      let customerId: string | null = null;
      if (a._clienteRut) customerId = customerMap.get(a._clienteRut) || null;
      if (!customerId && a._clienteEmail) customerId = customerMap.get(a._clienteEmail.toLowerCase()) || null;
      if (!customerId && a._clienteNombre) customerId = customerMap.get(`name:${a._clienteNombre}`) || null;

      if (!customerId) {
        logger.warn(`Activo ${a.serialNumber || a.model || 'sin-id'}: cliente no encontrado, omitido`);
        continue;
      }

      // Resolver tipo de activo
      let assetTypeId: string | null = null;
      if (a._tipoActivo) {
        assetTypeId = typeMap.get(a._tipoActivo.toLowerCase()) ?? null;
      }

      const created = await prisma.asset.create({
        data: {
          id: a.id,
          tenantId: a.tenantId,
          customerId,
          assetTypeId,
          brand: a.brand,
          model: a.model,
          serialNumber: a.serialNumber,
          licensePlate: a.licensePlate,
          year: a.year,
          color: a.color,
          mileage: a.mileage,
          accessories: a.accessories,
          visualCondition: a.visualCondition,
          notes: a.notes,
          isActive: a.isActive,
          createdBy: a.createdBy,
        },
      });

      if (a.serialNumber) assetMap.set(a.serialNumber.toUpperCase(), created.id);
      if (a.licensePlate) assetMap.set(a.licensePlate.toUpperCase(), created.id);

      logger.debug(`Activo creado: ${a.brand || ''} ${a.model || ''} (${created.id})`);
    } catch (err: any) {
      logger.error(`Error creando activo ${a.serialNumber || a.model}: ${err.message}`);
    }
  }

  return assetMap;
}

async function importProducts(
  prisma: PrismaClient,
  products: ParsedProduct[],
  config: MigrationConfig,
  logger: MigrationLogger
): Promise<void> {
  // Obtener categorías del tenant
  const categories = await prisma.productCategory.findMany({
    where: { tenantId: config.tenantId },
  });
  const catMap = new Map<string, string>(categories.map((c: any) => [c.name.toLowerCase(), c.id]));

  for (const p of products) {
    try {
      let categoryId: string | null = null;
      if (p._categoriaNombre) {
        categoryId = catMap.get(p._categoriaNombre.toLowerCase()) ?? null;
      }

      const created = await prisma.product.create({
        data: {
          id: p.id,
          tenantId: p.tenantId,
          categoryId,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          unit: p.unit,
          cost: p.cost,
          price: p.price,
          wholesalePrice: p.wholesalePrice,
          taxRate: p.taxRate,
          minStock: p.minStock,
          location: p.location,
          isActive: p.isActive,
        },
      });

      // Crear stock inicial si hay stock actual
      if (p._stockActual > 0) {
        await prisma.inventory.create({
          data: {
            tenantId: p.tenantId,
            productId: created.id,
            branchId: config.branchId,
            quantity: p._stockActual,
            reservedQuantity: 0,
          },
        });

        await prisma.inventoryMovement.create({
          data: {
            tenantId: p.tenantId,
            productId: created.id,
            branchId: config.branchId,
            type: 'initial',
            quantity: p._stockActual,
            previousStock: 0,
            newStock: p._stockActual,
            unitCost: p.cost,
            reason: 'Stock inicial migrado desde Gestioo',
          },
        });
      }

      logger.debug(`Producto creado: ${p.name} (${created.id})`);
    } catch (err: any) {
      logger.error(`Error creando producto ${p.name}: ${err.message}`);
    }
  }
}

async function importOrders(
  prisma: PrismaClient,
  orders: ParsedOrder[],
  customerMap: Map<string, string>,
  assetMap: Map<string, string>,
  config: MigrationConfig,
  logger: MigrationLogger
): Promise<void> {
  // Obtener estados del tenant
  const statuses = await prisma.workOrderStatus.findMany({
    where: { tenantId: config.tenantId },
  });
  const statusMap = new Map<string, string>(statuses.map((s: any) => [s.code.toLowerCase(), s.id]));
  const defaultStatusId = statuses.find((s: any) => s.isInitial)?.id || statuses[0]?.id;

  if (!defaultStatusId) {
    logger.error('No se encontraron estados de orden de trabajo. Ejecuta el seed primero.');
    return;
  }

  for (const o of orders) {
    try {
      // Resolver customerId
      let customerId: string | null = null;
      if (o._clienteRut) customerId = customerMap.get(o._clienteRut) || null;
      if (!customerId && o._clienteEmail) customerId = customerMap.get(o._clienteEmail.toLowerCase()) || null;
      if (!customerId && o._clienteNombre) customerId = customerMap.get(`name:${o._clienteNombre}`) || null;

      if (!customerId) {
        logger.warn(`Orden ${o.orderNumber}: cliente no encontrado, omitida`);
        continue;
      }

      // Resolver assetId
      let assetId: string | null = null;
      if (o._activoSerial) assetId = assetMap.get(o._activoSerial.toUpperCase()) || null;
      if (!assetId && o._activoPatente) assetId = assetMap.get(o._activoPatente.toUpperCase()) || null;

      // Resolver statusId
      let statusId = defaultStatusId;
      if (o._estadoCodigo) {
        const mapped = statusMap.get(o._estadoCodigo.toLowerCase());
        if (mapped) statusId = mapped;
      }

      await prisma.workOrder.create({
        data: {
          id: o.id,
          tenantId: o.tenantId,
          branchId: o.branchId,
          orderNumber: o.orderNumber,
          customerId,
          assetId,
          statusId,
          priority: o.priority,
          orderType: o.orderType,
          initialDiagnosis: o.initialDiagnosis,
          technicalDiagnosis: o.technicalDiagnosis,
          internalNotes: o.internalNotes,
          clientNotes: o.clientNotes,
          receivedAt: o.receivedAt,
          promisedAt: o.promisedAt,
          completedAt: o.completedAt,
          deliveredAt: o.deliveredAt,
          subtotalProducts: o.subtotalProducts,
          subtotalServices: o.subtotalServices,
          discountAmount: o.discountAmount,
          taxAmount: o.taxAmount,
          totalAmount: o.totalAmount,
          createdBy: o.createdBy,
        },
      });

      logger.debug(`Orden creada: ${o.orderNumber}`);
    } catch (err: any) {
      logger.error(`Error creando orden ${o.orderNumber}: ${err.message}`);
    }
  }
}

// ─── Flujo principal ──────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🔧 TallerHub — Migración desde Gestioo\n');

  const config = loadConfig();
  const args = parseArgs();

  if (args.dryRun) config.dryRun = true;

  const entitiesToProcess: EntityName[] = args.entity
    ? [args.entity as EntityName]
    : ['customers', 'assets', 'products', 'orders'];

  // Verificar que existan los archivos CSV
  for (const entity of entitiesToProcess) {
    const filePath = path.join(config.csvDir, ENTITY_FILES[entity]);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Archivo no encontrado: ${filePath} — Se omitirá '${entity}'`);
      entitiesToProcess.splice(entitiesToProcess.indexOf(entity), 1);
    }
  }

  if (entitiesToProcess.length === 0) {
    console.error('❌ No se encontraron archivos CSV para procesar.');
    console.error(`   Coloca los archivos en: ${config.csvDir}`);
    console.error(`   Archivos esperados: ${Object.values(ENTITY_FILES).join(', ')}`);
    process.exit(1);
  }

  // Inicializar Prisma solo si no es validate-only
  let prisma: PrismaClient | null = null;
  if (!args.validateOnly && !config.dryRun) {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos\n');
  } else {
    console.log(config.dryRun ? '🔍 Modo DRY RUN — No se escribirá en la BD\n' : '🔍 Modo VALIDACIÓN — Solo se validan los CSV\n');
  }

  // Mapas de referencia cruzada
  let customerMap = new Map<string, string>();
  let assetMap = new Map<string, string>();

  try {
    // ── 1. Clientes ──
    if (entitiesToProcess.includes('customers')) {
      const logger = new MigrationLogger('customers', config.logLevel);
      logger.info('═══ Iniciando importación de CLIENTES ═══');

      const filePath = path.join(config.csvDir, ENTITY_FILES.customers);
      const customers = parseCustomers(filePath, config.tenantId, config.migrationUserId, logger);

      if (prisma && !args.validateOnly) {
        customerMap = await importCustomers(prisma, customers, logger);
      } else {
        // En modo validación, igual construir el mapa para validar refs
        customers.forEach((c) => {
          if (c.email) customerMap.set(c.email.toLowerCase(), c.id);
          if (c.taxId) customerMap.set(c.taxId, c.id);
          customerMap.set(`name:${c.firstName} ${c.lastName || ''}`.trim(), c.id);
        });
      }

      logger.printSummary();
      logger.close();
    }

    // ── 2. Activos ──
    if (entitiesToProcess.includes('assets')) {
      const logger = new MigrationLogger('assets', config.logLevel);
      logger.info('═══ Iniciando importación de ACTIVOS ═══');

      const filePath = path.join(config.csvDir, ENTITY_FILES.assets);
      const assets = parseAssets(filePath, config.tenantId, config.migrationUserId, logger);

      if (prisma && !args.validateOnly) {
        assetMap = await importAssets(prisma, assets, customerMap, config, logger);
      } else {
        assets.forEach((a) => {
          if (a.serialNumber) assetMap.set(a.serialNumber.toUpperCase(), a.id);
          if (a.licensePlate) assetMap.set(a.licensePlate.toUpperCase(), a.id);
        });
      }

      logger.printSummary();
      logger.close();
    }

    // ── 3. Productos ──
    if (entitiesToProcess.includes('products')) {
      const logger = new MigrationLogger('products', config.logLevel);
      logger.info('═══ Iniciando importación de PRODUCTOS ═══');

      const filePath = path.join(config.csvDir, ENTITY_FILES.products);
      const products = parseProducts(filePath, config.tenantId, logger);

      if (prisma && !args.validateOnly) {
        await importProducts(prisma, products, config, logger);
      }

      logger.printSummary();
      logger.close();
    }

    // ── 4. Órdenes ──
    if (entitiesToProcess.includes('orders')) {
      const logger = new MigrationLogger('orders', config.logLevel);
      logger.info('═══ Iniciando importación de ÓRDENES DE TRABAJO ═══');

      const filePath = path.join(config.csvDir, ENTITY_FILES.orders);
      const orders = parseOrders(filePath, config.tenantId, config.branchId, config.migrationUserId, logger);

      if (prisma && !args.validateOnly) {
        await importOrders(prisma, orders, customerMap, assetMap, config, logger);
      }

      logger.printSummary();
      logger.close();
    }

    console.log('\n✅ Migración completada. Revisa los logs en ./logs/\n');
  } catch (err: any) {
    console.error('\n❌ Error fatal durante la migración:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main();
