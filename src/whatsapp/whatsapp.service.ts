import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private logger = new Logger(WhatsappService.name);
  constructor(private config: ConfigService) {}

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
      return response.data;
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

  async handleStatusUpdate(payload: any) {
    console.log(payload);
  }

  async sendWhatsappInteractiveMessage(
    to: string,
    message: string,
    options: { id: string; title: string }[],
  ) {
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
        type: 'interactive',
        interactive: {
          type: 'button', // 'list' if you prefer a list format
          body: {
            text: message,
          },
          action: {
            buttons: options.map((option) => ({
              type: 'reply',
              reply: {
                id: option.id,
                title: option.title,
              },
            })),
          },
        },
      }),
    });

    if (response.status === 200) {
      throw new HttpException(
        'Interactive message sent successfully',
        HttpStatus.OK,
      );
    }
    console.log(response);

    return response.data;
  }
}
