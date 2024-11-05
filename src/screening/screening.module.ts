import { Module } from '@nestjs/common';
import { ScreeningService } from './screening.service';

@Module({
  providers: [ScreeningService]
})
export class ScreeningModule {}
