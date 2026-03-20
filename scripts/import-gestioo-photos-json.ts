import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

type GestiooPhoto = {
  url: string;
  archivo?: string;
};

type GestiooOrderPhotos = {
  orden_id: number;
  numeracion: string;
  fotos: GestiooPhoto[];
};

const prisma = new PrismaClient();

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
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Debes indicar la ruta del JSON. Ej: npm run import:gestioo:fotos:json -- /ruta/gestioo_fotos.json');
    process.exit(1);
  }

  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as GestiooOrderPhotos[];

  const workOrders = await prisma.workOrder.findMany({
    select: { id: true, orderNumber: true, tenantId: true },
  });
  const localMap = new Map(
    workOrders.map((o) => [digitsOnly(o.orderNumber), o]),
  );

  let created = 0;
  for (const entry of data) {
    const local = localMap.get(digitsOnly(entry.numeracion));
    if (!local) continue;
    for (const photo of entry.fotos || []) {
      const fileName = photo.archivo?.split('/').pop() || photo.url.split('/').pop() || 'foto.jpg';
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
