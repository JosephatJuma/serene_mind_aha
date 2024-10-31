import { Vonage } from '@vonage/server-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VonageService {
  constructor(private config: ConfigService) {}
  async sendVerificationSms(phoneNumber: string, brand: string) {
    await this.configureVonage()
      .verify.start({
        number: phoneNumber,
        brand: brand,
      })
      .then(() => {
        return true;
      })
      .catch((err: any) => {
        Logger.log(err);
        return false;
      });
  }

  async sendMessage(to: string, message: string) {
    const params = {
      type: 'whatsapp',
      number: to,
      message,
    };
    return this.configureVonage().message.send(params);
  }

  async receiveMessage(req: any) {
    const message = req.body;
    // Process incoming message
    console.log(message);
  }

  configureVonage() {
    return new (Vonage as any)({
      apiKey: this.config.get('VONAGE_API_KEY'),
      apiSecret: this.config.get('VONAGE_API_SECRET'),
      // apiKey: '',
      // apiSecret: '',
    });
  }
}
