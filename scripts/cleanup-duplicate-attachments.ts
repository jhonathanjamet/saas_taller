import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

const HASH_FILE_RE = /^[0-9a-f]{40}\.(jpg|jpeg|png|webp)$/i;

function buildOriginalUrl(bucket: string, fileName: string) {
  return `https://${bucket}.s3.amazonaws.com/taller/fotos/${fileName}`;
}

function extractKeyFromUrl(url: string, bucket: string) {
  const normalized = url.replace(/^https?:\/\//, '');
  const hostPath = normalized.split('/');
  const host = hostPath.shift() || '';
  const path = hostPath.join('/');
  if (host.startsWith(`${bucket}.`)) return path;
  if (host === 's3.amazonaws.com' || host.endsWith('amazonaws.com')) {
    if (path.startsWith(`${bucket}/`)) return path.slice(bucket.length + 1);
  }
  return path;
}

async function main() {
  const dryRun = process.env.DRY_RUN !== '0';
  const s3 = await prisma.s3Config.findFirst({ where: { isActive: true } });
  if (!s3) {
    console.error('S3 no configurado.');
    process.exit(1);
  }

  const bucket = s3.bucket;
  const client = new S3Client({
    region: s3.region || 'us-east-1',
    endpoint: s3.endpoint || undefined,
    forcePathStyle: Boolean(s3.endpoint),
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
    },
  });

  const attachments = await prisma.fileAttachment.findMany({
    where: {
      tenantId: s3.tenantId,
      NOT: { fileUrl: { contains: '/taller/fotos/' } },
    },
  });

  let updated = 0;
  let deleted = 0;
  for (const file of attachments) {
    if (!HASH_FILE_RE.test(file.fileName)) continue;
    const originalUrl = buildOriginalUrl(bucket, file.fileName);
    const currentKey = extractKeyFromUrl(file.fileUrl, bucket);
    if (!currentKey || currentKey.startsWith('taller/fotos/')) continue;

    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: `taller/fotos/${file.fileName}` }));
    } catch {
      continue;
    }

    if (!dryRun) {
      await prisma.fileAttachment.update({
        where: { id: file.id },
        data: { fileUrl: originalUrl },
      });
      updated += 1;
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: currentKey }));
      deleted += 1;
    } else {
      updated += 1;
      deleted += 1;
    }
  }

  if (dryRun) {
    console.log(`DRY_RUN: Se actualizarían ${updated} registros y se borrarían ${deleted} objetos.`);
  } else {
    console.log(`Limpieza completada. URLs actualizadas: ${updated}, objetos borrados: ${deleted}`);
  }
}

main()
  .catch((err) => {
    console.error('Error limpiando adjuntos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
