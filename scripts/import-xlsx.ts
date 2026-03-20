import 'dotenv/config';
import * as path from 'node:path';
import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

type Row = Record<string, any>;

const prisma = new PrismaClient();

function norm(value: any): string {
  return String(value ?? '').trim();
}

function normalizeText(value: any): string {
  return norm(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function pick(row: Row, keys: string[]): string {
  for (const key of keys) {
    const v = norm(row[key]);
    if (v) return v;
  }
  return '';
}

function looksLikeArea(value: any): boolean {
  const v = normalizeText(value);
  return ['entrada', 'reparacion', 'salida', 'domicilio'].some((k) => v.includes(k));
}

function looksLikeStatus(value: any): boolean {
  const v = normalizeText(value);
  return [
    'chequeo',
    'sin estado',
    'esperando respuesta',
    'esperando repuesto',
    'reparacion',
    'no reparado',
    'reparado',
    'cambio',
    'instalado',
    'retenido',
    'sin solucion',
    'no presento',
    'entregada',
    'en revision',
    'aprobada',
    'pendiente',
  ].some((k) => v.includes(k));
}

function splitFullName(raw?: string, fallbackFirst?: string) {
  const value = norm(raw);
  const fallback = norm(fallbackFirst);
  if (!value && fallback) {
    return { firstName: fallback, lastName: '' };
  }
  if (!value) return { firstName: fallback, lastName: '' };
  if (value.includes(',')) {
    const [last, first] = value.split(',').map((p) => p.trim());
    return { firstName: first || fallback, lastName: last || '' };
  }
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: fallback, lastName: parts[0] };
  }
  return {
    firstName: parts.slice(1).join(' ') || fallback,
    lastName: parts[0],
  };
}

function parseDate(value: string): Date | null {
  const v = norm(value);
  if (!v) return null;
  const parts = v.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map((p) => Number(p));
    if (!Number.isNaN(dd) && !Number.isNaN(mm) && !Number.isNaN(yyyy)) {
      return new Date(yyyy, mm - 1, dd);
    }
  }
  const dt = new Date(v);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function priorityMap(value: string) {
  const v = norm(value).toLowerCase();
  if (v.includes('urg')) return 'urgent';
  if (v.includes('alta')) return 'high';
  if (v.includes('baja')) return 'low';
  return 'medium';
}

function statusCodeFromText(value: string) {
  const v = norm(value).toLowerCase();
  if (v.includes('sin estado')) return 'sin_estado';
  if (v.includes('cheque')) return 'chequeo';
  if (v.includes('esperando respuesta') || v.includes('esp. respuesta')) return 'esperando_respuesta';
  if (v.includes('repuesto')) return 'esperando_repuesto';
  if (v.includes('no present') || v.includes('no presentó')) return 'no_presento_falla';
  if (v.includes('no repar')) return 'no_reparado';
  if (v.includes('reparado')) return 'reparado';
  if (v.includes('instalad')) return 'instalado';
  if (v.includes('cambio')) return 'cambio';
  if (v.includes('reten')) return 'retenido';
  if (v.includes('sin sol')) return 'sin_solucion';
  if (v.includes('repar')) return 'reparacion';
  if (v.includes('entreg')) return 'entregada';
  if (v.includes('cancel')) return 'cancelada';
  if (v.includes('garan')) return 'garantia';
  if (v.includes('aprob')) return 'aprobada';
  if (v.includes('pend')) return 'pendiente_aprobacion';
  if (v.includes('revisi')) return 'en_revision';
  return 'ingresada';
}

function statusMetaFromCode(code: string) {
  const meta: Record<string, { name: string; color: string; sortOrder: number; isFinal: boolean }> = {
    ingresada: { name: 'Ingresada', color: '#3B82F6', sortOrder: 1, isFinal: false },
    en_revision: { name: 'En Revisión', color: '#8B5CF6', sortOrder: 2, isFinal: false },
    pendiente_aprobacion: { name: 'Pendiente Aprobación', color: '#F59E0B', sortOrder: 3, isFinal: false },
    aprobada: { name: 'Aprobada', color: '#10B981', sortOrder: 4, isFinal: false },
    esperando_repuesto: { name: 'Esperando Repuesto', color: '#F97316', sortOrder: 5, isFinal: false },
    en_reparacion: { name: 'En Reparación', color: '#6366F1', sortOrder: 6, isFinal: false },
    lista_entrega: { name: 'Lista para Entrega', color: '#14B8A6', sortOrder: 7, isFinal: false },
    entregada: { name: 'Entregada', color: '#22C55E', sortOrder: 8, isFinal: true },
    cancelada: { name: 'Cancelada', color: '#EF4444', sortOrder: 9, isFinal: true },
    garantia: { name: 'Garantía', color: '#EC4899', sortOrder: 10, isFinal: false },
    chequeo: { name: 'Chequeo', color: '#94A3B8', sortOrder: 11, isFinal: false },
    sin_estado: { name: 'Sin estado', color: '#94A3B8', sortOrder: 12, isFinal: false },
    esperando_respuesta: { name: 'Esperando respuesta', color: '#F59E0B', sortOrder: 13, isFinal: false },
    reparacion: { name: 'Reparación', color: '#6366F1', sortOrder: 14, isFinal: false },
    cambio: { name: 'Cambio', color: '#14B8A6', sortOrder: 15, isFinal: false },
    instalado: { name: 'Instalado', color: '#10B981', sortOrder: 16, isFinal: false },
    no_presento_falla: { name: 'No presentó falla', color: '#F59E0B', sortOrder: 17, isFinal: false },
    no_reparado: { name: 'No reparado', color: '#EF4444', sortOrder: 18, isFinal: false },
    reparado: { name: 'Reparado', color: '#22C55E', sortOrder: 19, isFinal: false },
    retenido: { name: 'Retenido', color: '#A855F7', sortOrder: 20, isFinal: false },
    sin_solucion: { name: 'Sin solución', color: '#64748B', sortOrder: 21, isFinal: false },
  };
  return meta[code] || { name: code, color: '#94A3B8', sortOrder: 99, isFinal: false };
}

function orderTypeFromArea(value: string) {
  const v = norm(value).toLowerCase();
  if (v.includes('repar')) return 'reparacion';
  if (v.includes('entrada')) return 'entrada';
  if (v.includes('salida')) return 'salida';
  return v || 'reparacion';
}

async function main() {
  const filePath = process.argv[2] || process.env.XLSX_PATH;
  if (!filePath) {
    console.error('Debe indicar la ruta del .xlsx. Ejemplo: npm run import:xlsx -- /ruta/archivo.xlsx');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  const workbook = xlsx.readFile(absPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // El archivo tiene una fila vacía antes de los headers, por eso usamos range: 1.
  const rows = xlsx.utils.sheet_to_json<Row>(sheet, { defval: '', range: 1 });
  console.log(`Filas detectadas en Excel: ${rows.length}`);
  if (rows.length > 0) {
    console.log('Headers detectados:', Object.keys(rows[0]));
  }

  const tenantId =
    process.env.TENANT_ID ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id;
  if (!tenantId) {
    console.error('No se encontró tenant. Define TENANT_ID en .env o crea uno.');
    process.exit(1);
  }

  const statusList = await prisma.workOrderStatus.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  const statusMap = new Map(statusList.map((s) => [s.code, s.id]));
  const defaultStatusId = statusMap.get('ingresada') || statusList[0]?.id;
  if (!defaultStatusId) {
    console.error('No hay estados de OT en la base. Ejecuta el seed.');
    process.exit(1);
  }

  const branchCache = new Map<string, string>();
  const areaCounter = new Map<string, number>();
  const statusCounter = new Map<string, number>();

  let createdCount = 0;
  for (const row of rows) {
    const orderRaw = norm(row['ORDEN N°']);
    const fecha = parseDate(pick(row, ['FECHA', 'INGRESO']));
    const prioridad = priorityMap(row['PRIORIDAD']);

    // Algunos Excel exportados llegan "corridos" cuando FINALIZACIÓN viene vacío.
    // Intentamos detectar Área/Estado en columnas vecinas para no perder datos.
    const rawAreaCandidate = (() => {
      const candidates = [
        row['Área'],
        row['FINALIZACIÓN'],
        row['ESTADO'],
      ];
      return candidates.find((v) => looksLikeArea(v)) ?? '';
    })();

    const rawStatusCandidate = (() => {
      const candidates = [
        row['ESTADO'],
        row['Área'],
        row['FINALIZACIÓN'],
        row['TIPO'],
      ];
      return candidates.find((v) => looksLikeStatus(v)) ?? '';
    })();

    const area = orderTypeFromArea(rawAreaCandidate || row['Área']);
    let estado = statusCodeFromText(rawStatusCandidate || row['ESTADO']);
    const serial = pick(row, ['N° SERIE']);
    const marca = pick(row, ['MARCA', 'ESTADO']);
    const modelo = pick(row, ['MODELO', 'TIPO']);
    const nombreCliente = pick(row, ['NOMBRE DEL CLIENTE', 'CLIENTE']);
    const apellidoNombre = pick(row, ['APELLIDO Y NOMBRE', 'CLIENTE']);
    const responsable = pick(row, ['RESPONSABLE']);
    const adelanto = Number(pick(row, ['ADELANTO']) || 0);
    const total = Number(pick(row, ['TOTAL']) || 0);
    const sucursal = pick(row, ['SUCURSAL']) || 'Sucursal Principal';

    areaCounter.set(area, (areaCounter.get(area) || 0) + 1);
    statusCounter.set(estado, (statusCounter.get(estado) || 0) + 1);

    if (!orderRaw && !nombreCliente && !apellidoNombre) continue;

    let branchId = branchCache.get(sucursal);
    if (!branchId) {
      const existing = await prisma.branch.findFirst({
        where: { tenantId, name: sucursal },
        select: { id: true, code: true },
      });
      if (existing) {
        branchId = existing.id;
      } else {
        let code = sucursal
          .replace(/[^A-Za-z0-9 ]/g, '')
          .split(' ')
          .filter(Boolean)
          .map((p) => p[0]?.toUpperCase())
          .join('')
          .slice(0, 4);
        if (!code) code = 'BR';
        const created = await prisma.branch.create({
          data: { tenantId, name: sucursal, code },
        });
        branchId = created.id;
      }
      branchCache.set(sucursal, branchId);
    }

    let customerId: string | undefined;
    if (apellidoNombre) {
      const parsed = splitFullName(apellidoNombre, nombreCliente);
      const firstName = parsed.firstName || apellidoNombre;
      const lastName = parsed.lastName || '';
      const existing =
        (await prisma.customer.findFirst({
          where: { tenantId, firstName, lastName },
          select: { id: true, firstName: true, lastName: true },
        })) ||
        (await prisma.customer.findFirst({
          where: { tenantId, firstName: apellidoNombre },
          select: { id: true, firstName: true, lastName: true },
        }));
      if (existing) {
        customerId = existing.id;
        const shouldUpdate =
          (!existing.lastName && lastName) ||
          (existing.firstName === apellidoNombre && firstName && firstName !== existing.firstName);
        if (shouldUpdate) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: { firstName, lastName },
          });
        }
      } else {
        const created = await prisma.customer.create({
          data: {
            tenantId,
            type: 'person',
            firstName,
            lastName,
            isActive: true,
          },
        });
        customerId = created.id;
      }
    } else if (nombreCliente) {
      const existing = await prisma.customer.findFirst({
        where: {
          tenantId,
          OR: [{ legalName: nombreCliente }, { firstName: nombreCliente }],
        },
        select: { id: true, legalName: true },
      });
      if (existing) {
        customerId = existing.id;
        if (!existing.legalName) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: { legalName: nombreCliente },
          });
        }
      } else {
        const created = await prisma.customer.create({
          data: {
            tenantId,
            type: 'company',
            legalName: nombreCliente,
            firstName: nombreCliente,
            isActive: true,
          },
        });
        customerId = created.id;
      }
    }

    if (!customerId) continue;

    let assetId: string | undefined;
    if (serial || marca || modelo) {
      const existing = await prisma.asset.findFirst({
        where: {
          tenantId,
          ...(serial ? { serialNumber: serial } : { customerId, serialNumber: null }),
          ...(marca ? { brand: marca } : {}),
          ...(modelo ? { model: modelo } : {}),
        },
        select: { id: true },
      });
      if (existing) {
        assetId = existing.id;
      } else {
        const created = await prisma.asset.create({
          data: {
            tenantId,
            customerId,
            brand: marca || undefined,
            model: modelo || undefined,
            serialNumber: serial || undefined,
            isActive: true,
          },
        });
        assetId = created.id;
      }
    }

    const orderNumber = orderRaw ? `IMP-${String(orderRaw).padStart(4, '0')}` : `IMP-${String(Date.now()).slice(-6)}`;
    let statusId = statusMap.get(estado);
    if (!statusId) {
      const meta = statusMetaFromCode(estado);
      const createdStatus = await prisma.workOrderStatus.create({
        data: {
          tenantId,
          code: estado,
          name: meta.name,
          color: meta.color,
          sortOrder: meta.sortOrder,
          isInitial: estado === 'ingresada',
          isFinal: meta.isFinal,
          isSystem: true,
        },
        select: { id: true, code: true },
      });
      statusId = createdStatus.id;
      statusMap.set(createdStatus.code, createdStatus.id);
    }
    if (!statusId) statusId = defaultStatusId;

    const existingOrder = await prisma.workOrder.findUnique({
      where: { tenantId_orderNumber: { tenantId, orderNumber } },
      select: { id: true },
    });

    const payload = {
      tenantId,
      branchId,
      orderNumber,
      customerId,
      ...(assetId ? { assetId } : {}),
      statusId,
      priority: prioridad as any,
      orderType: area,
      receivedAt: fecha || undefined,
      internalNotes: responsable ? `Responsable: ${responsable}` : undefined,
      totalAmount: total || undefined,
      discountAmount: 0,
      taxAmount: 0,
      subtotalProducts: 0,
      subtotalServices: 0,
      internalCost: 0,
      profitMargin: 0,
    };

    if (existingOrder) {
      await prisma.workOrder.update({
        where: { id: existingOrder.id },
        data: payload,
      });
    } else {
      await prisma.workOrder.create({ data: payload });
      createdCount += 1;
    }
  }

  console.log(`Importación completada. Órdenes creadas: ${createdCount}`);
  console.log('Áreas detectadas (import):', Object.fromEntries(areaCounter.entries()));
  console.log('Estados detectados (import):', Object.fromEntries(statusCounter.entries()));
}

main()
  .catch((err) => {
    console.error('Error importando:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
