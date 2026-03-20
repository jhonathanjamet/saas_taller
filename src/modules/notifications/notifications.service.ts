import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  templates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  logs() {
    return this.prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  createLog(dto: CreateNotificationLogDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.notificationLog.create({
      data: {
        tenantId,
        channel: dto.channel as any,
        recipient: dto.recipient,
        subject: dto.subject,
        body: dto.body,
        status: 'queued',
      },
    });
  }
}
