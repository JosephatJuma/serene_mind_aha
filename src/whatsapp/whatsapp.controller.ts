import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { MessageDto } from './dto/message.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('whatsapp')
@ApiTags('Whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'The sender of the message without + ',
          example: '256764990357',
        },

        message: {
          type: 'string',
          description: 'The message content',
          example: 'Hello, how are you?',
        },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook received',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async handleWebhook(@Body() dto: MessageDto) {
    await this.whatsappService.receiveMessage(dto);
  }
}
