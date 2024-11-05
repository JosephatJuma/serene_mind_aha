import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Vonage } from '@vonage/server-sdk';
import { ConfigService } from '@nestjs/config';
import WhatsApp from 'whatsapp';
import { MessageDto, IncomingMessageDto } from './dto/message.dto';
import { HttpService } from '@nestjs/axios';
import { PrismaClient, Client, Status } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private vonage: any;
  private wa: WhatsApp;
  private logger = new Logger(WhatsappService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaClient,
  ) {}

  async receiveMessage(dto: MessageDto) {
    // Send response
    await this.sendWhatsappMessage(dto.to, dto.message);
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
      return response.data
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

  

  async handleIncomingMessage(message: any): Promise<void> {
    if (message.type === 'text') {
      await this.processMessage(message.text.body, message.from);
    } else if (message.type == 'options') {
      // Not at all (0-1 days ).
      // Several days ( 2-6 days).
      // More than half the days (7 -11 days)
      // Nearly everyday (1 2-14 days)

      await this.sendWhatsappInteractiveMessage(
        message.from,
        'Over the last two weeks, how often have you been bothered by any of the following problems? Please select/ tick the statements below to help me assess you better:\n\nLittle interest/ pleasure in doing things\n',
        [
          { id: '1', title: 'Not at all' },
          { id: '2', title: 'Several days' },
          { id: '3', title: 'Nearly everyday' },
          // { id: '4', title: 'More than half' },
        ],
      );
    } else {
      await this.sendWhatsappMessage(
        message.from,
        'Could not process message ',
      );
    }
  }

  private async processMessage(message: string, phoneNumber: string) {
    console.log(message, phoneNumber);

    const client: Client = await this.prisma.client.findUnique({
      where: { whatsapp_number: phoneNumber },
    });

    // const client=await this.prisma.client.create({data:{whatsapp_number:phoneNumber, name:'James'}})

    if (client == null) {
      const welcomeMessage = await this.prisma.question.findFirst({
        where: { status: Status.WELCOME },
      });
      await this.prisma.client.create({
        data: { whatsapp_number: phoneNumber, screeningStatus: Status.WELCOME },
      });
      return await this.sendWhatsappMessage(
        phoneNumber,
        'Hello there 👋\n\nWelcome to the AHA mental health online platform. My name is Serene Mind AHA, your health partner. Please note that we value your privacy and that whatever you share here is highly confidential.\n\nWould you tell me about yourself?',
      );
    } else {
      switch (client.screeningStatus) {
        case null:
        case 'WELCOME':
          await this.handleWelcomeMessage(client, message);
          break;
        case 'NAME':
          await this.handleNameResponse(client, message);
          break;
        case 'AGE':
          await this.handleAgeResponse(client, message);
          break;
        case 'GENDER':
          await this.handleGenderResponse(client, message);
          break;
        case 'LOCATION':
          await this.handleLocationResponse(client, message);
          break;

        case 'NEXT_OF_KIN':
          await this.handleNextOfKinResponse(client, message);
          break;
        case 'NEXT_OF_KIN_PHONE':
          await this.handleNextOfKinPhoneResponse(client, message);
          break;
        case 'SCREENING':
          await this.handleScreeningResponse(client, message);
          break;
        default:
          await this.sendWhatsappMessage(phoneNumber, 'Invalid state');
      }
    }
  }

  private async handleWelcomeMessage(client: Client, message: string) {
    if (message.toLowerCase() === 'yes') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'NAME' },
      });
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'What is your name?',
      );
    } 
    
    else if(message.toLowerCase() === 'no') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'SCREENING' },
      });
      await this.startScreening(client);
    }
    else{
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Please reply with Yes or No\n\nWould you tell me about yourself?',
      );
    }
  }

  private async handleNameResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'AGE', name: message },
    });
    await this.sendWhatsappMessage(
      client.whatsapp_number,
      `Hello ${message}, What is your age?`,
    );
  }

  private async handleAgeResponse(client: Client, message: string) {
    if (isNaN(Number(message))) {
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Age must be a number\n\nWhat is your age?',
      );
    }
    else{
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'GENDER', age: parseInt(message) },
    });
    await this.sendWhatsappMessage(
      client.whatsapp_number,
      'What is your gender?',
    );
  }
  }

  private async handleGenderResponse(client: Client, message: string) {
    if (
      message.toLowerCase() !== 'male' &&
      message.toLowerCase() !== 'female'
    ) {
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Please provide a valid gender, gender should be Male or Female',
      );
    }
    else{
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'LOCATION', gender: message.toUpperCase() },
    });
    await this.sendWhatsappMessage(
      client.whatsapp_number,
      'Where do you stay?',
      )}
  }

  private async handleLocationResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'NEXT_OF_KIN', location: message },
    });
    await this.sendWhatsappMessage(
      client.whatsapp_number,
      'Are you staying with someone?',
    );
  }
  private async handleNextOfKinResponse(client: Client, message: string) {
   
    if (message.toLowerCase() == 'yes') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: {
          screeningStatus: 'NEXT_OF_KIN_PHONE',
          is_staying_with_someone: true,
        },
      });
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Please provide the phone number of the person you are staying with ',
      );
    } else if (message.toLowerCase() == 'no') {
      await this.prisma.client.update({
        where: { id: client.id },
        data: { screeningStatus: 'SCREENING', is_staying_with_someone: true },
      });
      await this.handleScreeningResponse(client, 'Screening begins....');
    } else {
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Invalid response, please respond with yes or no\n\nAre you staying with someone?',
      );
    }
  }
  private async handleNextOfKinPhoneResponse(client: Client, message: string) {
    await this.prisma.client.update({
      where: { id: client.id },
      data: { screeningStatus: 'SCREENING', someone_phone_number: message },
    });
    await this.handleScreeningResponse(client, '');
  }

  private async startScreening(client: Client) {
    if (!client.isScreened) {
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Starting screening...',
      );
      // Implement screening questions logic here
      // ...
    } else {
      await this.sendWhatsappMessage(
        client.whatsapp_number,
        'Thank you for completing the screening. A specialist will reach out to you soon.',
      );
    }
  }

  private async handleScreeningResponse(client: Client, message: string) {
    // Implement screening question handling logic here
    // ...
    await this.sendWhatsappMessage(
      client.whatsapp_number,
      'Screening Begins....',
    );
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
