import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { VonageService } from './vonage/vonage.service';
import { ConfigService } from '@nestjs/config';
import { WebhookModule } from './webhook/webhook.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    WhatsappModule,
    WebhookModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [AppService, VonageService, ConfigService],
})
export class AppModule {}
