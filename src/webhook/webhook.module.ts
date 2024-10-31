import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { VonageService } from 'src/vonage/vonage.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [WebhookController],
  providers: [ConfigService, WhatsappService, VonageService],
})
export class WebhookModule {}
