import { IsString } from 'class-validator';
export class MessageDto {
  @IsString()
  from: string;

  @IsString()
  message: string;
}

export class MessagePayloadDto {
  @IsString()
  body: string;
}
