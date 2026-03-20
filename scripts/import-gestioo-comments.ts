import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

type GestiooOrder = {
  id: string;
  numeracion: string | number;
};

type GestiooOrderListResponse = {
  data?: GestiooOrder[];
};

type GestiooNote = {
  nota?: string | null;
  titulo?: string | null;
  visualizacion?: number | string | null;
  creado?: string | null;
  usuario_nombre?: string | null;
  usuario_apellido?: string | null;
  usuario_email?: string | null;
};

type GestiooNotesResponse = {
  datos?: {
    orden?: {
      numeracion?: string | number;
      notas?: GestiooNote[];
    };
    notas?: GestiooNote[];
  };
  error?: number;
};

config();
if (existsSync('.env.gestioo')) {
  config({ path: '.env.gestioo', override: true });
}

const prisma = new PrismaClient();
const execFileAsync = promisify(execFile);

function digitsOnly(value: string) {
  const digits = value.match(/\d+/g)?.join('') || '';
  if (!digits) return '';
  const num = Number(digits);
  return Number.isFinite(num) ? String(num) : digits;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toBoolean(value?: number | string | null) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value !== 0;
  const lower = String(value).trim().toLowerCase();
  if (['1', 'true', 'si', 'sí', 'yes'].includes(lower)) return true;
  if (['0', 'false', 'no'].includes(lower)) return false;
  return null;
}

async function main() {
  const baseUrl = process.env.GESTIOO_BASE_URL || 'https://taller.gestioo.net';
  const listUrl = process.env.GESTIOO_ORDERS_URL || `${baseUrl}/taller/ordenes/lista`;
  const notesUrlBase =
    process.env.GESTIOO_NOTES_URL || `${baseUrl}/taller/ordenes/obtener_orden/{id}`;
  const cookie = process.env.GESTIOO_COOKIE;

  if (!cookie) {
    console.error('Falta GESTIOO_COOKIE en el entorno.');
    process.exit(1);
  }

  const listPayload = process.env.GESTIOO_LIST_PAYLOAD;
  const listBody = listPayload
    ? new URLSearchParams(listPayload)
    : new URLSearchParams({
        draw: '1',
        start: '0',
        length: '500',
      });
  const referer = process.env.GESTIOO_REFERER || `${baseUrl}/taller/ordenes/sucursal/3123`;

  const useCurl = process.env.GESTIOO_USE_CURL === '1';

  const commonHeaders = [
    '-H',
    'accept: application/json, text/javascript, */*; q=0.01',
    '-H',
    'content-type: application/x-www-form-urlencoded; charset=UTF-8',
    '-H',
    'x-requested-with: XMLHttpRequest',
    '-H',
    `origin: ${baseUrl}`,
    '-H',
    `referer: ${referer}`,
    '-H',
    'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  ];

  let listJson: GestiooOrderListResponse;
  if (useCurl) {
    const { stdout } = await execFileAsync('curl', [
      '-s',
      '-L',
      listUrl,
      ...commonHeaders,
      '-b',
      cookie,
      '--data-raw',
      listBody.toString(),
    ]);
    const raw = stdout || '';
    if (raw.trim().startsWith('<')) {
      console.error('Respuesta HTML recibida. Probablemente sesión expirada o bloqueo de Cloudflare.');
      console.error('Vuelve a copiar la cookie y asegúrate que el cURL manual devuelve JSON.');
      process.exit(1);
    }
    listJson = JSON.parse(raw || '{}') as GestiooOrderListResponse;
  } else {
    const listRes = await fetch(listUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        origin: baseUrl,
        referer,
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        cookie,
      },
      body: listBody.toString(),
    });

    if (!listRes.ok) {
      console.error('No se pudo obtener listado de órdenes en Gestioo:', listRes.status);
      process.exit(1);
    }

    listJson = (await listRes.json()) as GestiooOrderListResponse;
  }

  const orders = listJson.data || [];
  if (orders.length === 0) {
    console.log('No se encontraron órdenes en Gestioo.');
    process.exit(0);
  }

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

  for (const order of orders) {
    const local = localMap.get(digitsOnly(String(order.numeracion)));
    if (!local) {
      skippedNoOrder += 1;
      continue;
    }

    const notesPayloadTemplate = process.env.GESTIOO_NOTES_PAYLOAD;
    const payloadString = notesPayloadTemplate
      ? notesPayloadTemplate.replace(/\{id\}/g, String(order.id))
      : '';
    const notesUrl = notesUrlBase.includes('{id}')
      ? notesUrlBase.replace(/\{id\}/g, String(order.id))
      : notesUrlBase;

    let notesJson: GestiooNotesResponse | null = null;
    if (useCurl) {
      const { stdout } = await execFileAsync('curl', [
        '-s',
        '-L',
        notesUrl,
        ...commonHeaders,
        '-b',
        cookie,
        '--data-raw',
        payloadString,
      ]);
      const raw = stdout || '';
      if (!raw.trim()) continue;
      if (raw.trim().startsWith('<')) continue;
      notesJson = JSON.parse(raw || '{}') as GestiooNotesResponse;
    } else {
      const notesRes = await fetch(notesUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'x-requested-with': 'XMLHttpRequest',
          origin: baseUrl,
          referer,
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          cookie,
        },
        body: payloadString,
      });

      if (!notesRes.ok) continue;
      notesJson = (await notesRes.json()) as GestiooNotesResponse;
    }

    if (!notesJson) continue;
    if (notesJson.error && notesJson.error !== 0) continue;

    const notes = notesJson.datos?.orden?.notas || notesJson.datos?.notas || [];
    if (!notes.length) continue;

    for (const note of notes) {
      const content = (note.nota || note.titulo || '').trim();
      if (!content) {
        skippedNoContent += 1;
        continue;
      }
      const fullName = [note.usuario_nombre, note.usuario_apellido]
        .filter(Boolean)
        .join(' ')
        .trim();
      const userId =
        (note.usuario_email && userByEmail.get(note.usuario_email.toLowerCase())) ||
        (fullName && userByName.get(normalizeName(fullName))) ||
        local.assignedTo ||
        local.createdBy ||
        defaultUserByTenant.get(local.tenantId);
      if (!userId) {
        skippedNoContent += 1;
        continue;
      }

      const createdAt = parseDate(note.creado);
      const isPublic = toBoolean(note.visualizacion);

      const existing = await prisma.workOrderComment.findFirst({
        where: {
          tenantId: local.tenantId,
          workOrderId: local.id,
          userId,
          content,
          createdAt: createdAt ?? undefined,
        },
        select: { id: true },
      });
      if (existing) {
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
