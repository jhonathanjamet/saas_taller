import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

type GestiooOrder = {
  id: string;
  numeracion: string;
};

type GestiooOrderListResponse = {
  data?: GestiooOrder[];
};

type GestiooPhoto = {
  id: number;
  orden_id: number;
  url: string;
  archivo: string;
};

type GestiooPhotosResponse = {
  datos?: GestiooPhoto[];
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

function guessMimeType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpeg') || lower.endsWith('.jpg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

async function main() {
  const baseUrl = process.env.GESTIOO_BASE_URL || 'https://taller.gestioo.net';
  const listUrl = process.env.GESTIOO_ORDERS_URL || `${baseUrl}/taller/ordenes/lista`;
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
    select: { id: true, orderNumber: true, tenantId: true },
  });
  const localMap = new Map(
    workOrders.map((o) => [digitsOnly(o.orderNumber), o]),
  );

  let created = 0;
  for (const order of orders) {
    const local = localMap.get(digitsOnly(order.numeracion));
    if (!local) continue;

    const photosUrl = `${baseUrl}/taller/ordenes/guardar_imagenes/${order.id}`;
    let photosJson: GestiooPhotosResponse | null = null;
    if (useCurl) {
      const { stdout } = await execFileAsync('curl', [
        '-s',
        photosUrl,
        ...commonHeaders,
        '-b',
        cookie,
        '--data-raw',
        '',
      ]);
      photosJson = JSON.parse(stdout || '{}') as GestiooPhotosResponse;
    } else {
      const photosRes = await fetch(photosUrl, {
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
        body: '',
      });

      if (!photosRes.ok) continue;
      photosJson = (await photosRes.json()) as GestiooPhotosResponse;
    }

    if (!photosJson) continue;
    if (photosJson.error && photosJson.error !== 0) continue;

    const photos = photosJson.datos || [];
    for (const photo of photos) {
      const fileName = photo.archivo?.split('/').pop() || 'foto.jpg';
      const existing = await prisma.fileAttachment.findFirst({
        where: {
          tenantId: local.tenantId,
          entityType: 'work_order',
          entityId: local.id,
          fileUrl: photo.url,
        },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.fileAttachment.create({
        data: {
          tenantId: local.tenantId,
          entityType: 'work_order',
          entityId: local.id,
          fileName,
          fileUrl: photo.url,
          fileSize: 0,
          mimeType: guessMimeType(fileName),
        },
      });
      created += 1;
    }
  }

  console.log(`Importación completada. Adjuntos creados: ${created}`);
}

main()
  .catch((err) => {
    console.error('Error importando fotos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
