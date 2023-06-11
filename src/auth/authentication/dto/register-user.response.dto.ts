import { UserDto } from '../../../users/dto';

export class RegisterUserResponseDto {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
}
