import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Vonage } from '@vonage/server-sdk';
import { ConfigService } from '@nestjs/config';
import WhatsApp from 'whatsapp';
import { MessageDto } from './dto/message.dto';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private vonage: any;
  private wa: WhatsApp;
  private logger = new Logger(WhatsappService.name);

  constructor(
    private config: ConfigService,
    //private readonly httpService: HttpService,
  ) {}

  // async sendWhatsappMessage(
  //   recipientNumber: string,
  //   message: string,
  // ): Promise<any> {
  //   try {
  //     await this.wa.messages.text(
  //       {
  //         body: message,
  //         preview_url: false,
  //       },
  //       parseInt(recipientNumber),
  //     );
  //   } catch (e) {
  //     console.error(e.message);
  //     return e;
  //   }
  // }

  async sendMessage(to: string, message: string) {
    const params = {
      type: 'text',
      number: to,
      message,
    };
    return this.configureVonage().message.send(params);
  }

  async receiveMessage(dto: MessageDto) {
    const userNumber = dto.to;
    const messageBody = dto.message;

    // Authorization logic
    if (messageBody === 'auth_code') {
      // Verify user identity
      // ...
    }

    // Menu system
    if (messageBody === '1') {
      // Perform action 1
      // ...
    } else if (messageBody === '2') {
      // Perform action 2
      // ...
    }

    // Send response
    await this.sendWhatsappMessageWithVonage(dto.to, dto.message);
  }

  configureVonage() {
    return new (Vonage as any)({
      apiKey: this.config.get('VONAGE_API_KEY'),
      apiSecret: this.config.get('VONAGE_API_SECRET'),
      // apiKey: '',
      // apiSecret: '',
    });
  }

  async sendWhatsappMessage(to: string, message: string) {
    const response = await axios({
      method: 'post',
      url: `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${this.config.get('CLOUD_API_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      }),
    });
    if (response.status === 200) {
      throw new HttpException('Message sent successfully', HttpStatus.OK);
    }
    return response.data;
  }

  async sendWhatsappTemplateMessage(to: string, template: string) {
    const response = await axios({
      method: 'post',
      url: `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en_US' },
        },
      }),
    });
    console.log(response);
    return response;
  }

  private async sendWhatsappMessageWithVonage(to: string, message: string) {
    const response = await axios({
      method: 'post',
      url: `https://messages-sandbox.nexmo.com/v1/messages`,
      auth: {
        username: '368e70f4',
        password: '5w64r9t7HfMLUSbJ',
      },

      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: {
        from: '14157386102',
        to: to,
        message_type: 'text',
        text: message,
        channel: 'whatsapp',
      },
    })
      .then((response) => {
        console.log(response);

        return response;
      })
      .catch((error) => {
        console.log(error);
        throw new HttpException(error, error.status);
      });
  }

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Handles incoming WhatsApp messages.
   *
   * @param {any} payload
   *
   * @returns {Promise<void>}
   */
  /******  05166fb9-8c79-45ad-b42c-2bdefd1887df  *******/
  async handleIncomingMessage(payload: any): Promise<void> {
    try {
      this.logger.log('Received WhatsApp message:', JSON.stringify(payload));

      if (payload.type === 'text') {
        return await this.processMessage(payload);
      }

      return;
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
      throw new HttpException('Failed to process incoming message', 500);
    }
  }

  async handleStatusUpdate(payload: any): Promise<void> {
    try {
      this.logger.log('Received status update:', JSON.stringify(payload));

      // Process the status update here
      // You can log delivery reports, etc.
      // For example:
      // await this.updateMessageStatus(payload);

      return;
    } catch (error) {
      this.logger.error('Error handling status update:', error);
      throw new HttpException('Failed to process status update', 500);
    }
  }

  // Example method for processing messages
  private async processMessage(payload: any): Promise<any> {
    // Implement your message processing logic here
    // For example, save to database, trigger notifications, etc.
    return payload;
  }

  // Example method for updating message status
  private async updateMessageStatus(payload: any): Promise<void> {
    // Implement your status update logic here
    // For example, update database records, trigger follow-ups, etc.
  }
}
