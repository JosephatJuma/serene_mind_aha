import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { QuestionDto } from './dto/question.dto';
@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaClient) {}
  //add question
  async addQuestion(data: QuestionDto) {
    return this.prisma.question.create({ data: data });
  }
}
