import { UserDto } from '../../../users/dto';

export class LoginUserResponseDto {
    user: UserDto;

    accessToken: string;

    refreshToken: string;
}
