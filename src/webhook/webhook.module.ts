import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { VonageService } from 'src/vonage/vonage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [WebhookController],
  providers: [ConfigService, WhatsappService, VonageService, PrismaClient],
})
export class WebhookModule {}
