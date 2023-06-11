import { IsString } from 'class-validator';

export class LoginUserBodyDto {
    @IsString()
    username: string;

    @IsString()
    password: string;
}
