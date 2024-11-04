import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Status } from '@prisma/client';
export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUUID()
  parentId: string;

  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;
}
