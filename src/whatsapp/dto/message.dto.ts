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

type TextMessage = {
  body: string;
};
type AudioMessage = {
  mime_type: string;
  sha256: string;
  id: string;
  voice: boolean;
};
type ImageMessage = {
  mime_type: string;
  sha256: string;
  id: string;
};
type VideoMessage = {
  mime_type: string;
  sha256: string;
  id: string;
};

export type IncomingMessageDto = {
  from: string;
  id: string;
  timestamp: number;
  type: string;
  text?: TextMessage;
  audio?: AudioMessage;
  image?: ImageMessage;
  video?: VideoMessage;
  interactive: Object;
};
