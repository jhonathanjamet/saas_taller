import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { MessagingConfigService } from './messaging-config.service';
import { UpsertMessagingConfigDto } from './dto/upsert-messaging-config.dto';
import { SendOrderLinkDto } from './dto/send-order-link.dto';
import { WhatsappQrService } from './whatsapp-qr.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('integrations/messaging')
export class MessagingConfigController {
  constructor(
    private readonly messaging: MessagingConfigService,
    private readonly whatsappQr: WhatsappQrService,
  ) {}

  @Get()
  @RequirePermission('integrations:read')
  get() {
    return this.messaging.get();
  }

  @Put()
  @RequirePermission('integrations:configure')
  upsert(@Body() dto: UpsertMessagingConfigDto) {
    return this.messaging.upsert(dto);
  }

  @Post('send-order-link')
  @RequirePermission('work_orders:update')
  sendOrderLink(@Body() dto: SendOrderLinkDto) {
    return this.messaging.sendOrderLink(dto);
  }

  @Get('whatsapp-qr/status')
  @RequirePermission('integrations:read')
  whatsappQrStatus() {
    return this.whatsappQr.getStatus();
  }

  @Post('whatsapp-qr/start')
  @RequirePermission('integrations:configure')
  whatsappQrStart() {
    return this.whatsappQr.start();
  }

  @Post('whatsapp-qr/stop')
  @RequirePermission('integrations:configure')
  whatsappQrStop() {
    return this.whatsappQr.stop();
  }
}
