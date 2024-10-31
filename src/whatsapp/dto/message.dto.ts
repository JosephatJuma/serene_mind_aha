import { IsString } from 'class-validator';
export class MessageDto {
  @IsString()
  from: string;

  @IsString()
  message: string;
}

export class TemplateMessageDto {
  @IsString()
  from: string;

  @IsString()
  template: string;
}

export class MessagePayloadDto {
  @IsString()
  body: string;
}
