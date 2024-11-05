import { Module } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { DepressionQuestions } from './depression-questions.service';
import { PrismaClient } from '@prisma/client';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { AncientQuestions } from './anxienty-questions.service';

@Module({
  providers: [
    ScreeningService,
    PrismaClient,
    DepressionQuestions,
    WhatsappService,
    AncientQuestions,
  ],
})
export class ScreeningModule {}
