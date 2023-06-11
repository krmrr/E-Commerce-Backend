import { UserDto } from '../../../users/dto';

export class RefreshTokenResponseDto {
    user: UserDto;

    accessToken: string;

    refreshToken: string;
}
