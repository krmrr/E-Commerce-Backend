import { PartialType } from '@nestjs/mapped-types';
import { CreatePhoneNumberDto } from './create-phone-number.dto';
import {
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
} from 'class-validator';
import { CountryCode, Genre, PhoneNumberType, Proximity } from '../constants';

export class UpdatePhoneNumberDto extends PartialType(CreatePhoneNumberDto) {
    @IsOptional()
    @IsString()
    userId: string;

    @IsOptional()
    @IsEnum(CountryCode)
    countryCode?: CountryCode;

    @IsOptional()
    @IsString()
    contactName?: string;

    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @IsOptional()
    @IsEnum(PhoneNumberType)
    type?: PhoneNumberType;

    @IsOptional()
    @IsEnum(Genre)
    genre?: Genre;

    @IsOptional()
    @MaxLength(1024)
    @IsString()
    details?: string;

    @IsOptional()
    @IsEnum(Proximity)
    proximity?: Proximity;
}
