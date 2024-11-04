// whatsapp.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(
    private readonly whatsappService: WhatsappService,
    //private readonly webhookService: WebhookService,
  ) {}

  @Post('inbound')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message_uuid: {
          type: 'string',
          description: 'The UUID of the message',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },

        to: {
          type: 'object',
          example: { type: 'whatsapp', number: '14157386102' },
          description: 'The recipient of the message',
        },
        from: {
          type: 'object',
          example: { type: 'whatsapp', number: '256764990357' },
          description: 'The sender of the message',
        },
        timestamp: {
          type: 'string',
          example: '2019-12-31T10:00:00.000Z',
          description: 'The timestamp of the message',
        },
        text: {
          type: 'string',
          description: '1',
          example: 'Hello world',
        },
        message_type: {
          type: 'string',
          description: 'The type of the message',
          example: 'text',
        },
        channel: {
          type: 'string',
          description: 'The channel of the message',
          example: 'whatsapp',
        },
        status: {
          type: 'string',
          description: 'The status of the message',
          example: 'delivered',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The message was received successfully',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'The message was not received successfully',
    type: String,
  })
  async handleIncomingMessage(@Body() payload: any) {
    await this.whatsappService.handleIncomingMessage(payload);
  }

  @Post('status')
  async handleStatusUpdate(@Body() payload: any, @Res() res: Response) {
    await this.whatsappService.handleStatusUpdate(payload);
  }
}
