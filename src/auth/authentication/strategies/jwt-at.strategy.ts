import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private usersService: UsersService,
        private authService: AuthenticationService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.atKey'),
            passReqToCallback: true,
        });
    }

    async validate(req) {
        const accessTokenEncoded = req
            ?.get('authorization')
            ?.replace('Bearer', '')
            .trim();

        const accessToken = await this.authService.resolveAccessToken(
            accessTokenEncoded,
        );
        const user = accessToken.user;

        return {
            accessToken,
            user,
        };
    }
}
