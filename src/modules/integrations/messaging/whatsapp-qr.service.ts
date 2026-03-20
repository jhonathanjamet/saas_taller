import { BadRequestException, Injectable } from '@nestjs/common';
import { RequestContextService } from '../../../common/request-context/request-context.service';

type QrStatus = {
  status: 'idle' | 'connecting' | 'qr_ready' | 'connected' | 'disconnected' | 'error';
  qr?: string | null;
  lastError?: string | null;
  connectedAt?: string | null;
};

@Injectable()
export class WhatsappQrService {
  private clients = new Map<string, any>();
  private states = new Map<string, QrStatus>();

  constructor(private readonly context: RequestContextService) {}

  private getTenantIdOrThrow() {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant no disponible');
    return tenantId;
  }

  private getState(tenantId: string): QrStatus {
    return (
      this.states.get(tenantId) || {
        status: 'idle',
        qr: null,
        lastError: null,
        connectedAt: null,
      }
    );
  }

  async start() {
    const tenantId = this.getTenantIdOrThrow();
    const current = this.getState(tenantId);
    if (current.status === 'connecting' || current.status === 'qr_ready' || current.status === 'connected') {
      return current;
    }

    let wweb: any;
    try {
      wweb = await import('whatsapp-web.js');
    } catch {
      throw new BadRequestException(
        'Falta instalar whatsapp-web.js. Ejecuta: npm i whatsapp-web.js',
      );
    }

    const { Client, LocalAuth } = wweb;
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `tenant_${tenantId}`,
        dataPath: '.wwebjs_auth',
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.states.set(tenantId, {
      status: 'connecting',
      qr: null,
      lastError: null,
      connectedAt: null,
    });

    client.on('qr', (qr: string) => {
      this.states.set(tenantId, {
        status: 'qr_ready',
        qr,
        lastError: null,
        connectedAt: null,
      });
    });

    client.on('ready', () => {
      this.states.set(tenantId, {
        status: 'connected',
        qr: null,
        lastError: null,
        connectedAt: new Date().toISOString(),
      });
    });

    client.on('auth_failure', (message: string) => {
      this.states.set(tenantId, {
        status: 'error',
        qr: null,
        lastError: message || 'Fallo de autenticación',
        connectedAt: null,
      });
    });

    client.on('disconnected', (reason: string) => {
      this.states.set(tenantId, {
        status: 'disconnected',
        qr: null,
        lastError: reason || 'Sesión desconectada',
        connectedAt: null,
      });
    });

    this.clients.set(tenantId, client);
    client.initialize().catch((error: any) => {
      this.states.set(tenantId, {
        status: 'error',
        qr: null,
        lastError: error?.message || 'No se pudo inicializar WhatsApp QR',
        connectedAt: null,
      });
    });

    return this.getState(tenantId);
  }

  getStatus() {
    const tenantId = this.getTenantIdOrThrow();
    return this.getState(tenantId);
  }

  async stop() {
    const tenantId = this.getTenantIdOrThrow();
    const client = this.clients.get(tenantId);
    if (client) {
      try {
        await client.destroy();
      } catch {}
      this.clients.delete(tenantId);
    }
    const state: QrStatus = {
      status: 'disconnected',
      qr: null,
      lastError: null,
      connectedAt: null,
    };
    this.states.set(tenantId, state);
    return state;
  }

  async sendMessage(toPhone: string, message: string) {
    const tenantId = this.getTenantIdOrThrow();
    const state = this.getState(tenantId);
    if (state.status !== 'connected') {
      throw new BadRequestException('WhatsApp QR no está conectado');
    }
    const client = this.clients.get(tenantId);
    if (!client) {
      throw new BadRequestException('Cliente WhatsApp no disponible');
    }
    const digits = (toPhone || '').replace(/[^\d]/g, '');
    if (!digits) throw new BadRequestException('Teléfono inválido para WhatsApp');
    await client.sendMessage(`${digits}@c.us`, message);
    return { ok: true };
  }
}
