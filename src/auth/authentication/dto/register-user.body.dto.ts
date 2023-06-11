import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterUserBodyDto {
    @IsString()
    @Length(5, 16)
    username: string;

    @IsString()
    @Length(8, 32)
    password: string;

    @IsEmail()
    emailAddress: string;

    @IsString()
    lastName: string

    @IsString()
    firstName: string
}
