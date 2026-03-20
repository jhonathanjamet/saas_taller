import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RequestContextService } from '../../../common/request-context/request-context.service';
import { UpsertMessagingConfigDto } from './dto/upsert-messaging-config.dto';
import { SendOrderLinkDto } from './dto/send-order-link.dto';
import { WhatsappQrService } from './whatsapp-qr.service';

type MessagingConfig = {
  whatsappMode: 'api' | 'qr';
  whatsappEnabled: boolean;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappInstance: string;
  smsEnabled: boolean;
  smsApiUrl: string;
  smsApiKey: string;
  smsSender: string;
  emailEnabled: boolean;
  emailApiUrl: string;
  emailApiKey: string;
  emailFrom: string;
};

@Injectable()
export class MessagingConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
    private readonly whatsappQr: WhatsappQrService,
  ) {}

  private async getTenant() {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new NotFoundException('Tenant no encontrado');
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  private fromSettings(settings: any): MessagingConfig {
    const messaging = settings?.integrations?.messaging || {};
    return {
      whatsappMode: messaging.whatsappMode === 'qr' ? 'qr' : 'api',
      whatsappEnabled: Boolean(messaging.whatsappEnabled),
      whatsappApiUrl: messaging.whatsappApiUrl || '',
      whatsappApiKey: messaging.whatsappApiKey || '',
      whatsappInstance: messaging.whatsappInstance || '',
      smsEnabled: Boolean(messaging.smsEnabled),
      smsApiUrl: messaging.smsApiUrl || '',
      smsApiKey: messaging.smsApiKey || '',
      smsSender: messaging.smsSender || '',
      emailEnabled: Boolean(messaging.emailEnabled),
      emailApiUrl: messaging.emailApiUrl || '',
      emailApiKey: messaging.emailApiKey || '',
      emailFrom: messaging.emailFrom || '',
    };
  }

  async get() {
    const tenant = await this.getTenant();
    return this.fromSettings(tenant.settings || {});
  }

  async upsert(dto: UpsertMessagingConfigDto) {
    const tenant = await this.getTenant();
    const current = (tenant.settings || {}) as Record<string, any>;
    const integrations = (current.integrations || {}) as Record<string, any>;
    const previous = this.fromSettings(current);

    const next: MessagingConfig = {
      whatsappMode: dto.whatsappMode === 'qr' ? 'qr' : previous.whatsappMode,
      whatsappEnabled: dto.whatsappEnabled ?? previous.whatsappEnabled,
      whatsappApiUrl: dto.whatsappApiUrl ?? previous.whatsappApiUrl,
      whatsappApiKey: dto.whatsappApiKey ?? previous.whatsappApiKey,
      whatsappInstance: dto.whatsappInstance ?? previous.whatsappInstance,
      smsEnabled: dto.smsEnabled ?? previous.smsEnabled,
      smsApiUrl: dto.smsApiUrl ?? previous.smsApiUrl,
      smsApiKey: dto.smsApiKey ?? previous.smsApiKey,
      smsSender: dto.smsSender ?? previous.smsSender,
      emailEnabled: dto.emailEnabled ?? previous.emailEnabled,
      emailApiUrl: dto.emailApiUrl ?? previous.emailApiUrl,
      emailApiKey: dto.emailApiKey ?? previous.emailApiKey,
      emailFrom: dto.emailFrom ?? previous.emailFrom,
    };

    const settings = {
      ...current,
      integrations: {
        ...integrations,
        messaging: next,
      },
    };

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { settings },
    });

    return next;
  }

  async sendOrderLink(dto: SendOrderLinkDto) {
    const config = await this.get();
    const results: Array<{ channel: string; status: string; detail?: string }> = [];

    if (!dto.channels?.length) {
      throw new BadRequestException('Debes seleccionar al menos un canal');
    }

    for (const channel of dto.channels) {
      if (channel === 'whatsapp') {
        if (config.whatsappMode === 'qr') {
          try {
            if (!dto.toPhone) {
              results.push({ channel, status: 'skipped', detail: 'Destino no disponible' });
            } else {
              await this.whatsappQr.sendMessage(dto.toPhone, dto.message || dto.orderUrl);
              results.push({ channel, status: 'sent' });
            }
          } catch (error: any) {
            results.push({
              channel,
              status: 'failed',
              detail: error?.message || 'No se pudo enviar por QR',
            });
          }
        } else {
          const res = await this.sendToProvider({
            enabled: config.whatsappEnabled,
            apiUrl: config.whatsappApiUrl,
            apiKey: config.whatsappApiKey,
            channel,
            to: dto.toPhone,
            message: dto.message,
            orderUrl: dto.orderUrl,
            extra: { instance: config.whatsappInstance },
          });
          results.push(res);
        }
      }

      if (channel === 'sms') {
        const res = await this.sendToProvider({
          enabled: config.smsEnabled,
          apiUrl: config.smsApiUrl,
          apiKey: config.smsApiKey,
          channel,
          to: dto.toPhone,
          message: dto.message,
          orderUrl: dto.orderUrl,
          extra: { sender: config.smsSender },
        });
        results.push(res);
      }

      if (channel === 'email') {
        const res = await this.sendToProvider({
          enabled: config.emailEnabled,
          apiUrl: config.emailApiUrl,
          apiKey: config.emailApiKey,
          channel,
          to: dto.toEmail,
          message: dto.message,
          orderUrl: dto.orderUrl,
          extra: { from: config.emailFrom },
        });
        results.push(res);
      }
    }

    return { ok: true, results };
  }

  private async sendToProvider(input: {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    channel: 'whatsapp' | 'sms' | 'email';
    to?: string;
    message: string;
    orderUrl: string;
    extra?: Record<string, any>;
  }) {
    if (!input.enabled) {
      return { channel: input.channel, status: 'skipped', detail: 'Canal deshabilitado' };
    }
    if (!input.apiUrl) {
      return { channel: input.channel, status: 'skipped', detail: 'API URL no configurada' };
    }
    if (!input.to) {
      return { channel: input.channel, status: 'skipped', detail: 'Destino no disponible' };
    }

    try {
      const response = await fetch(input.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
        },
        body: JSON.stringify({
          channel: input.channel,
          to: input.to,
          message: input.message,
          orderUrl: input.orderUrl,
          ...input.extra,
        }),
      });

      if (!response.ok) {
        return {
          channel: input.channel,
          status: 'failed',
          detail: `HTTP ${response.status}`,
        };
      }
      return { channel: input.channel, status: 'sent' };
    } catch (error: any) {
      return {
        channel: input.channel,
        status: 'failed',
        detail: error?.message || 'Error de red',
      };
    }
  }
}
