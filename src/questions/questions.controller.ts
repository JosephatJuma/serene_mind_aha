import { Controller, Post, Body } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionDto } from './dto/question.dto';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content of the question',
          example:
            'Hello there 👋\n\nWelcome to the AHA mental health online platform. My name is Serene Mind AHA, your health partner. Please note that we value your privacy and that whatever you share here is highly confidential.\nWould you tell me about yourself?\n',
        },

        parentId: {
          type: 'string',
          description:
            'The id of the parent question(option if question has no parent)',
          example: 'ea7d8b4a-3e1e-4b0e-9b7b-7b7b7b7b7b7b',
        },

        status: {
          type: 'string',
          description: 'The status of the question',
          example: 'WELCOME',
        },
      },
    },
  })
  @ApiResponse({ type: QuestionDto })
  addQuestion(@Body() data: QuestionDto) {
    return this.questionsService.addQuestion(data);
  }
}
