import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  list(entityType: string, entityId: string) {
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType y entityId son requeridos');
    }
    return this.prisma.fileAttachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(params: {
    tenantId: string;
    entityType: string;
    entityId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy?: string | null;
  }) {
    const { tenantId, entityType, entityId, fileName, fileUrl, fileSize, mimeType, uploadedBy } = params;
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType y entityId son requeridos');
    }
    if (!tenantId) {
      throw new BadRequestException('tenantId requerido');
    }
    return this.prisma.fileAttachment.create({
      data: {
        tenantId,
        entityType,
        entityId,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        uploadedBy: uploadedBy || undefined,
      },
    });
  }
}
