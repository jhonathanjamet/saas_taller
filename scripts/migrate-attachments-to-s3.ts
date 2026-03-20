import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}

async function main() {
  const tenantIdInput = process.env.TENANT_ID;
  const oldBucket = process.env.OLD_S3_BUCKET;
  if (!oldBucket) {
    console.error('Debes definir OLD_S3_BUCKET en el entorno.');
    process.exit(1);
  }
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  const tenantId = tenantIdInput && uuidRegex.test(tenantIdInput) ? tenantIdInput : undefined;

  const s3 = await prisma.s3Config.findFirst({
    where: {
      isActive: true,
      ...(tenantId ? { tenantId } : {}),
    },
  });
  if (!s3) {
    console.error('S3 no configurado para el tenant.');
    process.exit(1);
  }

  const effectiveTenantId = s3.tenantId;

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
      tenantId: effectiveTenantId,
      fileUrl: { contains: oldBucket },
    },
  });

  let migrated = 0;
  for (const file of attachments) {
    try {
      const res = await fetch(file.fileUrl);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const safeName = file.fileName.replace(/\s+/g, '_');
      const basePath = s3.basePath ? s3.basePath.replace(/^\/+|\/+$/g, '') + '/' : '';
      const key = `${basePath}${file.entityType}/${file.entityId}/${Date.now()}-${safeName}`;

      await client.send(
        new PutObjectCommand({
          Bucket: s3.bucket,
          Key: key,
          Body: buffer,
          ContentType: file.mimeType || (isImageUrl(file.fileName) ? 'image/jpeg' : 'application/octet-stream'),
          ACL: 'public-read',
        }),
      );

      const region = s3.region || 'us-east-1';
      const newUrl = s3.endpoint
        ? `${s3.endpoint.replace(/\/+$/, '')}/${s3.bucket}/${key}`
        : `https://${s3.bucket}.s3.${region}.amazonaws.com/${key}`;

      await prisma.fileAttachment.update({
        where: { id: file.id },
        data: { fileUrl: newUrl },
      });
      migrated += 1;
    } catch {
      // Continue with next file
    }
  }

  console.log(`Migración completada. Archivos migrados: ${migrated}`);
}

main()
  .catch((err) => {
    console.error('Error migrando adjuntos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
