// whatsapp.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  Query,
  Get,
  Logger,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import * as process from 'node:process';
import { ScreeningService } from 'src/screening/screening.service';
import * as crypto from 'crypto';

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
        id: {
          type: 'string',
          description: 'The Id of incoming message of the message',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        from: {
          type: 'string',
          example: '256764990357',
          description: 'The sender of the message',
        },
        timestamp: {
          type: 'number',
          example: 1730828821,
          description: 'The timestamp of the message',
        },
        text: {
          type: 'object',
          description: ' the text message object if the type value is text',
          example: { body: 'Hi' },
        },
        type: {
          type: 'string',
          description: 'The type of the message',
          example: 'text',
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
  async handleIncomingMessage(@Body() payload: any, @Req() req: any) {
    const xHubSignature = req.headers['x-hub-signature'];
    const appSecret = process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;
    if (!xHubSignature || !appSecret) {
      Logger.warn('Invalid Source');
      throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
    }
    // Extract the actual signature value from the header
    // const [, signature] = xHubSignature.split('=');

    // // Generate the expected signature
    // const expectedSignature = crypto.createHmac('sha1', appSecret).update(JSON.stringify(payload)).digest('hex');

    // // Securely compare the signatures
    // if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    //   console.log('Signatures do not match');
    //   throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
    // }
    const { messages } = payload?.entry?.[0]?.changes?.[0]?.value ?? {};
    if (!messages) return;
    const message = messages[0];
    this.screnning.handleIncomingMessage(message);
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
      Logger.log('Established handshake from cloud api');
      return challenge.toString();
    }
    return 'Verification failed';
  }
}
