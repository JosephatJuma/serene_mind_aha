import { Module } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { DepressionQuestionsClass } from './depression-questions.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [ScreeningService,PrismaClient,DepressionQuestionsClass]
})
export class ScreeningModule {}
