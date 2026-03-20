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

function getString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function normalizeText(value: unknown) {
  return getString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areaFromText(value: unknown): 'entrada' | 'reparacion' | 'salida' | 'domicilio' | null {
  const v = normalizeText(value);
  if (!v) return null;
  if (v.includes('reparac')) return 'reparacion';
  if (v.includes('salida') || v.includes('entrega')) return 'salida';
  if (v.includes('entrada') || v.includes('ingreso')) return 'entrada';
  if (v.includes('domicilio') || v.includes('terreno')) return 'domicilio';
  return null;
}

function statusCodeFromText(
  value: unknown,
  area: 'entrada' | 'reparacion' | 'salida' | 'domicilio' | null,
) {
  const v = normalizeText(value);
  if (!v) return null;

  if (v.includes('sin estado')) return 'sin_estado';
  if (v.includes('cheque')) return 'chequeo';
  if (v.includes('esperando respuesta') || v.includes('esp respuesta')) return 'esperando_respuesta';
  if (v.includes('repuesto')) return 'esperando_repuesto';
  if (v.includes('no present')) return 'no_presento_falla';
  if (v.includes('no repar')) return 'no_reparado';
  if (v.includes('reparado')) return 'reparado';
  if (v.includes('instalad')) return 'instalado';
  if (v.includes('cambio')) return 'cambio';
  if (v.includes('reten')) return 'retenido';
  if (v.includes('sin solucion')) return 'sin_solucion';
  if (v === 'reparacion' || v === 'en reparacion') return 'reparacion';

  // Fallback controlado: "ingresada" no es subestado válido en este flujo.
  if (v.includes('ingresad')) {
    if (area === 'salida') return 'reparado';
    if (area === 'reparacion') return 'esperando_respuesta';
    return 'chequeo';
  }

  return null;
}

function statusMetaFromCode(code: string) {
  const meta: Record<string, { name: string; color: string; sortOrder: number; isFinal: boolean }> = {
    chequeo: { name: 'Chequeo', color: '#94A3B8', sortOrder: 11, isFinal: false },
    sin_estado: { name: 'Sin estado', color: '#94A3B8', sortOrder: 12, isFinal: false },
    esperando_respuesta: { name: 'Esperando respuesta', color: '#F59E0B', sortOrder: 13, isFinal: false },
    esperando_repuesto: { name: 'Esperando repuesto', color: '#F97316', sortOrder: 5, isFinal: false },
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

function extractAccessories(accessories: unknown) {
  if (!Array.isArray(accessories) || accessories.length === 0) return '';
  const names = accessories
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const obj = item as UnknownRecord;
        return getString(obj.nombre || obj.name || obj.descripcion || obj.description);
      }
      return '';
    })
    .filter(Boolean);
  return names.join(', ');
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Debes indicar la ruta del JSON. Ej: npm run import:gestioo:detalles:json -- /ruta/gestioo_comentarios.json');
    process.exit(1);
  }

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed?.datos?.orden
    ? [parsed.datos.orden]
    : (parsed?.datos || parsed?.data || []);

  const workOrders = await prisma.workOrder.findMany({
    select: { id: true, orderNumber: true, tenantId: true, statusId: true, orderType: true },
  });
  const localMap = new Map(
    workOrders.map((o) => [digitsOnly(o.orderNumber), o.id]),
  );

  const localOrderInfo = new Map(workOrders.map((o) => [o.id, o]));

  const statusRows = await prisma.workOrderStatus.findMany({
    select: { id: true, tenantId: true, code: true },
  });
  const statusMapByTenant = new Map<string, Map<string, string>>();
  for (const row of statusRows) {
    const map = statusMapByTenant.get(row.tenantId) || new Map<string, string>();
    map.set(row.code, row.id);
    statusMapByTenant.set(row.tenantId, map);
  }

  const ensureStatusId = async (tenantId: string, code: string) => {
    let tenantMap = statusMapByTenant.get(tenantId);
    if (!tenantMap) {
      tenantMap = new Map<string, string>();
      statusMapByTenant.set(tenantId, tenantMap);
    }
    const cached = tenantMap.get(code);
    if (cached) return cached;

    const existing = await prisma.workOrderStatus.findFirst({
      where: { tenantId, code },
      select: { id: true },
    });
    if (existing?.id) {
      tenantMap.set(code, existing.id);
      return existing.id;
    }

    const meta = statusMetaFromCode(code);
    const created = await prisma.workOrderStatus.create({
      data: {
        tenantId,
        code,
        name: meta.name,
        color: meta.color,
        sortOrder: meta.sortOrder,
        isInitial: code === 'chequeo',
        isFinal: meta.isFinal,
        isSystem: true,
      },
      select: { id: true },
    });
    tenantMap.set(code, created.id);
    return created.id;
  };

  let updated = 0;
  let areaStatusUpdated = 0;
  let skippedNoOrder = 0;

  for (const entry of entries as UnknownRecord[]) {
    const source: UnknownRecord =
      (entry as any)?.datos?.orden && typeof (entry as any).datos.orden === 'object'
        ? ((entry as any).datos.orden as UnknownRecord)
        : entry;

    const orderNumber = getString(source.numeracion || source.orderNumber || source.numero || source.nro);
    const localId = localMap.get(digitsOnly(orderNumber));
    if (!localId) {
      skippedNoOrder += 1;
      continue;
    }

    const localOrder = localOrderInfo.get(localId);
    if (!localOrder) {
      skippedNoOrder += 1;
      continue;
    }

    const trabajo = getString(source.descripcion);
    const descripcionEstado = getString(source.descripcion_estado);
    const accesorios = extractAccessories(source.accesorios);

    const area = areaFromText(
      source.area_nombre || source.area || source.orderType || source.tipo_area,
    );
    const statusCode = statusCodeFromText(
      source.estado_nombre || source.estado || source.status_name,
      area,
    );

    const nextData: Record<string, unknown> = {
      ...(trabajo ? { initialDiagnosis: trabajo } : {}),
      ...(descripcionEstado ? { technicalDiagnosis: descripcionEstado } : {}),
      ...(accesorios ? { clientNotes: accesorios } : {}),
    };

    if (area && area !== localOrder.orderType) {
      nextData.orderType = area;
    }

    if (statusCode) {
      const statusId = await ensureStatusId(localOrder.tenantId, statusCode);
      if (statusId && statusId !== localOrder.statusId) {
        nextData.statusId = statusId;
      }
    }

    if (Object.keys(nextData).length > 0) {
      await prisma.workOrder.update({
        where: { id: localId },
        data: nextData as any,
      });
      updated += 1;
      if ('statusId' in nextData || 'orderType' in nextData) {
        areaStatusUpdated += 1;
      }
    }
  }

  console.log(
    `Importación completada. Órdenes actualizadas: ${updated}. Área/estado ajustados: ${areaStatusUpdated}. Sin orden: ${skippedNoOrder}.`,
  );
}

main()
  .catch((err) => {
    console.error('Error importando detalles:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
