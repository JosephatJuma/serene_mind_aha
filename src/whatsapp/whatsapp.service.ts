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

  async sendWhatsappMessage(
    recipientNumber: string,
    message: string,
  ): Promise<any> {
    //const senderNumber = '<<SENDER_NUMBER>>'; // Replace with your sender number
    //this.wa = new WhatsApp(senderNumber);
    try {
      const sentTextMessage = this.wa.messages.send({
        messaging_product: 'whatsapp',
        to: recipientNumber,
        text: {
          body: message,
        },
      });
      const response = await sentTextMessage;
      console.log(response);
      return response;
    } catch (e) {
      console.error(e);
      return e;
    }
  }

  async sendMessage(to: string, message: string) {
    const params = {
      type: 'text',
      number: to,
      message,
    };
    return this.configureVonage().message.send(params);
  }

  async receiveMessage(dto: MessageDto) {
    const userNumber = dto.from;
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
    await this.sendWhatsappMessageWithVonage(dto.from, dto.message);
  }

  configureVonage() {
    return new (Vonage as any)({
      apiKey: this.config.get('VONAGE_API_KEY'),
      apiSecret: this.config.get('VONAGE_API_SECRET'),
      // apiKey: '',
      // apiSecret: '',
    });
  }

  // private async sendWhatsappMessage(to: string, message: string) {
  //   // const response = this.httpService.post(
  //   //   `https://graph.facebook.com/v20.0/${this.config.get('WA_PHONE_NUMBER_ID')}/messages`,
  //   //   Headers,
  //   //   {},
  //   // );
  //   const response = await axios({
  //     method: 'post',
  //     url: `https://graph.facebook.com/v20.0/442660612263668/messages`,
  //     headers: {
  //       Authorization: `Bearer EAA0waxIBri4BO6ZAOuvsYCosILlZBHTiXPIU8ZAklABVNZB99LXbxMm4KTJ7G829c1vo8A80UmEvbEK1idAtRbLX2oGikU5H8XQ7ZAkr2IkR8tYTNQy14QIhfDiK3daOy009QZCa3ZChSayiyYyszHWGZC54z4ubsZArnb8EWx2ZCSYHHu6p3SrQflsOJK37oUXzzha5wuGQrOLc1OPG2nPYJvWwYJdZAac464ZD'`,
  //       'Content-Type': 'application/json',
  //     },
  //     data: JSON.stringify({
  //       messaging_product: 'whatsapp',
  //       to: '256764990357',
  //       type: 'template',
  //       //text: { body: message },
  //       template: {
  //         name: 'hello_world',
  //         language: { code: 'en_US' },
  //       },
  //     }),
  //   });
  //   //console.log(response);
  //   return response;
  // }

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
