import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [HttpModule],
  providers: [WhatsappService, ConfigService, PrismaClient],
  controllers: [WhatsappController],
})
export class WhatsappModule {}
