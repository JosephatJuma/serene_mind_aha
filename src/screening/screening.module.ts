import { Module } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { DepressionQuestionsClass } from './depression-questions.service';
import { PrismaClient } from '@prisma/client';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { AnxietyQuestions } from './anxienty-questions.service';

@Module({
  providers: [
    ScreeningService,
    PrismaClient,
    DepressionQuestionsClass,
    WhatsappService,
    AnxietyQuestions,
  ],
})
export class ScreeningModule {}
