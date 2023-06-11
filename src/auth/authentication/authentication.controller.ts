import { Body, Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { UserDto } from '../../users/dto';
import { AuthenticationService } from './authentication.service';
import {
    LoginUserBodyDto,
    LoginUserResponseDto,
    RefreshTokenResponseDto,
    RegisterUserBodyDto,
    RegisterUserResponseDto,
} from './dto';
import { ConfigService } from '@nestjs/config';
import { Auth, CurrentUser } from './decorators';
import { RefreshToken } from './entities';
import { ResolvedToken } from './types';
import { Post } from '../../utils/nestia';
import { User } from '../../users/entities';

@Controller('api/auth')
export class AuthenticationController {
    constructor(
        private readonly config: ConfigService,
        private authenticationService: AuthenticationService,
    ) {}

    @Auth('local')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() body: LoginUserBodyDto,
        @CurrentUser() user: User,
    ): Promise<LoginUserResponseDto> {
        const refreshToken =
            await this.authenticationService.generateRefreshToken(
                user,
                this.config.get('auth.rtExpiresIn'),
            );
        const accessToken =
            await this.authenticationService.generateAccessToken(
                user,
                this.config.get('auth.atExpiresIn'),
                refreshToken.token as RefreshToken,
            );

        const payload = new LoginUserResponseDto();
        payload.user = new UserDto(user);
        payload.accessToken = accessToken.encoded;
        payload.refreshToken = refreshToken.encoded;

        return payload;
    }

    @Auth('jwt-refresh')
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @CurrentUser('refreshToken') refreshToken: ResolvedToken,
    ): Promise<RefreshTokenResponseDto> {
        const {
            user,
            accessToken,
            refreshToken: newRefreshToken,
        } = await this.authenticationService.createAccessTokenFromRefreshToken(
            refreshToken,
            this.config.get('auth.atExpiresIn'),
        );

        const payload = new RefreshTokenResponseDto();
        payload.user = new UserDto(user);
        payload.accessToken = accessToken.encoded;
        payload.refreshToken = newRefreshToken.encoded;

        return payload;
    }

    @Auth('jwt-refresh')
    @Post('revoke/refresh')
    @HttpCode(HttpStatus.OK)
    revokeRefresh(@CurrentUser('refreshToken') refreshToken: ResolvedToken) {
        return void this.authenticationService.revokeRefreshToken(refreshToken);
    }

    @Auth()
    @Post('revoke/access')
    @HttpCode(HttpStatus.OK)
    revokeAccess(@CurrentUser('accessToken') accessToken: ResolvedToken) {
        return void this.authenticationService.revokeAccessToken(accessToken);
    }

    /**
     * Register user and return access token and refresh token with user data.
     * @param registerDto - User data.
     * @return The newly created user with access token and refresh token.
     */
    @Post('register')
    async register(
        @Body() registerDto: RegisterUserBodyDto,
    ): Promise<RegisterUserResponseDto> {
        const user = await this.authenticationService.register(
            registerDto.username,
            registerDto.password,
            registerDto.emailAddress,
            registerDto.firstName,
            registerDto.lastName
        );

        const refreshToken =
            await this.authenticationService.generateRefreshToken(
                user,
                this.config.get('auth.rtExpiresIn'),
            );
        const accessToken =
            await this.authenticationService.generateAccessToken(
                user,
                this.config.get('auth.atExpiresIn'),
                refreshToken.token as RefreshToken,
            );

        const payload = new RegisterUserResponseDto();
        payload.user = new UserDto(user);
        payload.accessToken = accessToken.encoded;
        payload.refreshToken = refreshToken.encoded;

        return payload;
    }

    /**
     * Revokes all tokens for the user.
     * @param accessToken
     * @return revoked tokens
     */
    @Auth()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@CurrentUser('accessToken') accessToken: ResolvedToken) {
        return void this.authenticationService.logout(accessToken);
    }
}
