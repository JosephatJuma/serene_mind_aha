import { Test, TestingModule } from '@nestjs/testing';
import { VonageService } from './vonage.service';

describe('VonageService', () => {
  let service: VonageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VonageService],
    }).compile();

    service = module.get<VonageService>(VonageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
