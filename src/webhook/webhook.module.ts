import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { VonageService } from 'src/vonage/vonage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { ScreeningService } from 'src/screening/screening.service';
import { DepressionQuestions } from 'src/screening/depression-questions.service';
import { AncientQuestions } from 'src/screening/anxienty-questions.service';

@Module({
  controllers: [WebhookController],
  providers: [
    ConfigService,
    WhatsappService,
    VonageService,
    ScreeningService,
    PrismaClient,
    DepressionQuestions,
    AncientQuestions,
  ],
})
export class WebhookModule {}
