import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { AccessToken, RefreshToken } from './entities';
import { AtStrategy, LocalStrategy, RtStrategy } from './strategies';
import { AuthorizationModule } from '../authorization/authorization.module';
import { EmailsModule } from '../../users/emails/emails.module';

@Module({
    controllers: [AuthenticationController],
    imports: [
        MikroOrmModule.forFeature([AccessToken, RefreshToken]),
        JwtModule.register({}),
        forwardRef(() => PassportModule),
        forwardRef(() => UsersModule),
        forwardRef(() => EmailsModule),
        forwardRef(() => AuthorizationModule),
    ],
    providers: [AuthenticationService, LocalStrategy, AtStrategy, RtStrategy],
})
export class AuthenticationModule {}
