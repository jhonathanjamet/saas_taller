import { Module } from '@nestjs/common';
import { MessagingConfigController } from './messaging-config.controller';
import { MessagingConfigService } from './messaging-config.service';
import { WhatsappQrService } from './whatsapp-qr.service';

@Module({
  controllers: [MessagingConfigController],
  providers: [MessagingConfigService, WhatsappQrService],
  exports: [WhatsappQrService],
})
export class MessagingConfigModule {}
