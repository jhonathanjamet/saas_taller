import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id } });
    if (!endpoint) throw new NotFoundException('Webhook no encontrado');
    return endpoint;
  }

  create(dto: CreateWebhookDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        url: dto.url,
        events: dto.events || [],
        secret: 'change_me',
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdateWebhookDto) {
    await this.prisma.webhookEndpoint.updateMany({ where: { id }, data: dto as any });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.webhookEndpoint.deleteMany({ where: { id } });
    return { id };
  }
}
