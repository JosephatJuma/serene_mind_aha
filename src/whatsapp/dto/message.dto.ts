import { IsString } from 'class-validator';
export class MessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;
}

export class TemplateMessageDto {
  @IsString()
  to: string;

  @IsString()
  template: string;
}

export class MessagePayloadDto {
  @IsString()
  body: string;
}
