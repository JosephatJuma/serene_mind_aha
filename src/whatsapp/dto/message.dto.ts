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

// export class IncomingMessageDto {
//   @IsString()
//   from: string;
// }

export type IncomingMessageDto = {
  message_uuid: string;
  to: {
    type: 'whatsapp';
    number: string;
  };
  from: {
    type: 'whatsapp';
    number: string;
  };
  timestamp: string; // ISO date string format
  text: string;
  message_type: 'text';
  channel: 'whatsapp';
  status: 'delivered' | 'sent' | 'failed' | 'read'; // Other statuses can be added as needed
};
