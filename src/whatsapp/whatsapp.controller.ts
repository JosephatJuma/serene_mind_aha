import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { MessageDto, TemplateMessageDto } from './dto/message.dto';
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
        to: {
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

  @Post('/message')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
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
  async sendMessage(@Body() dto: MessageDto) {
    await this.whatsappService.sendWhatsappMessage(dto.to, dto.message);
  }

  @Post('/template')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'The sender of the message without + ',
          example: '256764990357',
        },

        template: {
          type: 'string',
          description: 'template name',
          example: 'hello_world',
        },
      },
    },
  })
  async sendTemplateMessage(@Body() dto: TemplateMessageDto) {
    await this.whatsappService.sendWhatsappTemplateMessage(
      dto.to,
      dto.template,
    );
  }
}
