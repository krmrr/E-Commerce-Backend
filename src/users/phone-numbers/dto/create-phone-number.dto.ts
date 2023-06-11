import {
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
} from 'class-validator';
import { CountryCode, Genre, Proximity, PhoneNumberType } from '../constants';

export class CreatePhoneNumberDto {
    @IsOptional()
    @IsString()
    userId: string;

    @IsEnum(CountryCode)
    countryCode: CountryCode;

    @IsOptional()
    @IsString()
    contactName: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsEnum(PhoneNumberType)
    type: PhoneNumberType;

    @IsEnum(Genre)
    genre: Genre;

    @IsOptional()
    @MaxLength(8)
    @IsString()
    internalCode?: string;

    @IsOptional()
    @MaxLength(1024)
    @IsString()
    details?: string;

    @IsOptional()
    @IsEnum(Proximity)
    proximity: Proximity;
}
