// whatsapp.controller.ts
import { Controller, Post, Body, Res, Query, Get } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import * as process from 'node:process';
import { ScreeningService } from 'src/screening/screening.service';

@Controller('webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly screnning: ScreeningService,
  ) {}

  @Post()
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
    const { messages } = payload?.entry?.[0]?.changes?.[0]?.value ?? {};
    if (!messages) return;
    const message = messages[0];
    const messageSender = message?.from;
    const messageId = message?.id;
    console.log(message);
    this.screnning.handleIncomingMessage(message);
    // switch(message?.type){
    //   case 'text':
    //     const text=message.text.body
    //     break
    // }
  }

  @Post('status')
  async handleStatusUpdate(@Body() payload: any, @Res() res: Response) {
    await this.whatsappService.handleStatusUpdate(payload);
  }
  @Get()
  whatsappVerificationChallenge(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    const verificationToken =
      process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;
    if (!mode || !token) {
      return 'Error verifying token';
    }
    if (mode === 'subscribe' && token === verificationToken) {
      console.log('hey from fb');
      return challenge.toString();
    }
    return 'Verification failed';
  }
}
