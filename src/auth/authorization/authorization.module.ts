import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Permission, Role } from './entities';
import { UsersModule } from '../../users/users.module';
import { User } from '../../users/entities';
import { CaslModule } from './casl.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([User, Role, Permission]),
        UsersModule,
        CaslModule,
    ],
    providers: [AuthorizationService],
    exports: [AuthorizationService],
})
export class AuthorizationModule {}
