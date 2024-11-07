import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfigService } from '@nestjs/config';
import { WebhookModule } from './webhook/webhook.module';
import { ConfigModule } from '@nestjs/config';
import { QuestionsModule } from './questions/questions.module';
import { ScreeningModule } from './screening/screening.module';

@Module({
  imports: [
    WhatsappModule,
    WebhookModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    QuestionsModule,
    ScreeningModule,
  ],
  controllers: [],
  providers: [AppService,  ConfigService],
})
export class AppModule {}
