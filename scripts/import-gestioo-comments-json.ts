import 'dotenv/config';
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

function getFirstString(obj: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function getFirstNumber(obj: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
  }
  return null;
}

function getFirstBoolean(obj: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      if (['1', 'true', 'si', 'sí', 'yes'].includes(lower)) return true;
      if (['0', 'false', 'no'].includes(lower)) return false;
    }
  }
  return null;
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractComments(entry: UnknownRecord): UnknownRecord[] {
  const candidates = [
    entry.comentarios,
    entry.comments,
    entry.observaciones,
    entry.mensajes,
    entry.notas,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean) as UnknownRecord[];
  }
  const singleText = getFirstString(entry, [
    'comentario',
    'comment',
    'texto',
    'text',
    'descripcion',
    'observacion',
    'contenido',
    'content',
  ]);
  if (singleText) return [entry];
  return [];
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Debes indicar la ruta del JSON. Ej: npm run import:gestioo:comentarios:json -- /ruta/gestioo_comentarios.json');
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
    select: { id: true, orderNumber: true, tenantId: true, createdBy: true, assignedTo: true },
  });
  const localMap = new Map(
    workOrders.map((o) => [digitsOnly(o.orderNumber), o]),
  );

  const users = await prisma.user.findMany({
    select: { id: true, tenantId: true, email: true, firstName: true, lastName: true },
  });
  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
  const userByName = new Map(
    users.map((u) => [normalizeName(`${u.firstName} ${u.lastName}`), u.id]),
  );
  const defaultUserByTenant = new Map<string, string>();
  for (const user of users) {
    if (!user.tenantId) continue;
    if (!defaultUserByTenant.has(user.tenantId)) defaultUserByTenant.set(user.tenantId, user.id);
  }

  let created = 0;
  let skippedNoOrder = 0;
  let skippedNoContent = 0;
  let skippedExisting = 0;

  for (const entry of entries as UnknownRecord[]) {
    const source: UnknownRecord =
      (entry as any)?.datos?.orden && typeof (entry as any).datos.orden === 'object'
        ? ((entry as any).datos.orden as UnknownRecord)
        : entry;

    const orderNumber = getFirstString(source, [
      'numeracion',
      'orderNumber',
      'numero',
      'nro',
      'orden',
      'orden_numero',
    ]);
    const local = localMap.get(digitsOnly(orderNumber));
    if (!local) {
      skippedNoOrder += 1;
      continue;
    }

    const comments = extractComments(source);
    if (!comments.length) {
      skippedNoContent += 1;
      continue;
    }

    for (const comment of comments) {
      const content = getFirstString(comment, [
        'comentario',
        'comment',
        'texto',
        'text',
        'nota',
        'descripcion',
        'observacion',
        'contenido',
        'content',
      ]);
      if (!content) {
        skippedNoContent += 1;
        continue;
      }

      const email = getFirstString(comment, ['usuario_email', 'user_email', 'email']);
      const name = getFirstString(comment, [
        'usuario_nombre',
        'user_name',
        'nombre_usuario',
        'nombre',
      ]);
      const lastName = getFirstString(comment, ['usuario_apellido', 'apellido', 'last_name']);
      const fullName = [name, lastName].filter(Boolean).join(' ').trim();
      const createdAt = parseDate(
        getFirstString(comment, ['creado', 'created', 'fecha', 'date', 'created_at', 'updated_at']),
      );
      const isPublic = getFirstBoolean(comment, [
        'publico',
        'is_public',
        'visible_cliente',
        'visible',
        'visualizacion',
      ]);

      const userId =
        (email && userByEmail.get(email.toLowerCase())) ||
        (fullName && userByName.get(normalizeName(fullName))) ||
        (name && userByName.get(normalizeName(name))) ||
        local.assignedTo ||
        local.createdBy ||
        defaultUserByTenant.get(local.tenantId);

      if (!userId) {
        skippedNoContent += 1;
        continue;
      }

      const exists = await prisma.workOrderComment.findFirst({
        where: {
          tenantId: local.tenantId,
          workOrderId: local.id,
          userId,
          content,
          createdAt: createdAt ?? undefined,
        },
        select: { id: true },
      });
      if (exists) {
        skippedExisting += 1;
        continue;
      }

      await prisma.workOrderComment.create({
        data: {
          tenantId: local.tenantId,
          workOrderId: local.id,
          userId,
          content,
          isInternal: isPublic === null ? true : !isPublic,
          createdAt: createdAt ?? undefined,
        },
      });
      created += 1;
    }
  }

  console.log(
    `Importación completada. Comentarios creados: ${created}. Sin orden: ${skippedNoOrder}. Sin contenido: ${skippedNoContent}. Duplicados: ${skippedExisting}.`,
  );
}

main()
  .catch((err) => {
    console.error('Error importando comentarios:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
