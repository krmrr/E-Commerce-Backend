import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { EmailType } from '../constants';

export class CreateEmailDto {
    @IsOptional()
    @IsString()
    userId: string;

    @IsEmail()
    address: string;

    @IsEnum(EmailType)
    type: EmailType;

    @IsOptional()
    @MaxLength(1024)
    @IsString()
    details?: string;
}
