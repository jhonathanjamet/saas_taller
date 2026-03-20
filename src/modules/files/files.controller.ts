import { BadRequestException, Controller, Get, Post, Query, UseGuards, UploadedFile, UseInterceptors, Req, InternalServerErrorException } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { FilesService } from './files.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../../infra/prisma/prisma.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('work_orders:read')
  list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.files.list(entityType, entityId);
  }

  @Post('upload')
  @RequirePermission('work_orders:update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType y entityId son requeridos');
    }
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    const s3 = await this.prisma.s3Config.findFirst({ where: { tenantId, isActive: true } });
    if (!s3) throw new BadRequestException('S3 no configurado');

    const region = s3.region || 'us-east-1';
    const endpoint = s3.endpoint || undefined;
    const client = new S3Client({
      region,
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
    });

    const safeName = file.originalname?.replace(/\s+/g, '_') || 'file';
    const keyBase = s3.basePath ? s3.basePath.replace(/^\/+|\/+$/g, '') + '/' : '';
    const key = `${keyBase}${entityType}/${entityId}/${Date.now()}-${safeName}`;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: s3.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException('No se pudo subir a S3');
    }

    const fileUrl = `https://${s3.bucket}.s3.${region}.amazonaws.com/${key}`;
    const uploadedBy = (req.user as any)?.id || undefined;
    return this.files.create({
      tenantId,
      entityType,
      entityId,
      fileName: file.originalname || file.filename,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy,
    });
  }
}
