import { PartialType } from '@nestjs/mapped-types';
import { CreateEmailDto } from './create-email.dto';
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { EmailType } from '../constants';

export class UpdateEmailDto extends PartialType(CreateEmailDto) {
    @IsOptional()
    @IsString()
    userId: string;

    @IsOptional()
    @IsEmail()
    address: string;

    @IsOptional()
    @IsEnum(EmailType)
    type: EmailType;

    @IsOptional()
    @MaxLength(1024)
    @IsString()
    details?: string;
}
