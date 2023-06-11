import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Module({
    imports: [
        PassportModule.registerAsync({
            useFactory: async (config: ConfigService) => {
                return config.get('auth.options');
            },
            inject: [ConfigService],
        }),
        AuthenticationModule,
        AuthorizationModule,
    ],
    exports: [PassportModule, AuthorizationModule],
})
export class AuthModule {}
