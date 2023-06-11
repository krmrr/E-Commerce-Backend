import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        configService: ConfigService,
        private usersService: UsersService,
        private authService: AuthenticationService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.rtKey'),
            passReqToCallback: true,
        });
    }

    async validate(req: any) {
        const refreshTokenEncoded = req
            ?.get('authorization')
            ?.replace('Bearer', '')
            .trim();

        const refreshToken = await this.authService.resolveRefreshToken(
            refreshTokenEncoded,
        );
        const user = refreshToken.user;

        return {
            refreshToken,
            user,
        };
    }
}
