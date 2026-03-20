import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { UpsertS3ConfigDto } from './dto/upsert-s3-config.dto';
import { RequestContextService } from '../../../common/request-context/request-context.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { TestS3ConfigDto } from './dto/test-s3-config.dto';

@Injectable()
export class S3ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  async get() {
    const tenantId = this.context.getTenantId();
    if (!tenantId) return null;
    return this.prisma.s3Config.findFirst({
      where: { tenantId },
    });
  }

  async upsert(dto: UpsertS3ConfigDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new NotFoundException('Tenant no encontrado');
    return this.prisma.s3Config.upsert({
      where: { tenantId },
      update: {
        accessKeyId: dto.accessKeyId,
        secretAccessKey: dto.secretAccessKey,
        bucket: dto.bucket,
        region: dto.region,
        endpoint: dto.endpoint,
        basePath: dto.basePath,
        isActive: dto.isActive ?? true,
      },
      create: {
        tenantId,
        accessKeyId: dto.accessKeyId,
        secretAccessKey: dto.secretAccessKey,
        bucket: dto.bucket,
        region: dto.region,
        endpoint: dto.endpoint,
        basePath: dto.basePath,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async test(dto: TestS3ConfigDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new NotFoundException('Tenant no encontrado');
    const stored = await this.prisma.s3Config.findFirst({ where: { tenantId } });
    const accessKeyId = dto.accessKeyId || stored?.accessKeyId;
    const secretAccessKey = dto.secretAccessKey || stored?.secretAccessKey;
    const bucket = dto.bucket || stored?.bucket;
    const region = dto.region || stored?.region || 'us-east-1';
    const endpoint = dto.endpoint || stored?.endpoint;
    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new BadRequestException('Faltan credenciales o bucket para probar');
    }

    const client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      return { ok: true };
    } catch (err: any) {
      const meta = err?.$metadata || {};
      const parts = [
        err?.name,
        err?.message,
        meta.httpStatusCode ? `HTTP ${meta.httpStatusCode}` : null,
        meta.requestId ? `requestId: ${meta.requestId}` : null,
      ].filter(Boolean);
      const message = parts.length ? parts.join(' · ') : 'Error desconocido al conectar con S3';
      throw new BadRequestException(message);
    }
  }
}
