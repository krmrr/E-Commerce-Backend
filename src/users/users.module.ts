import { MikroOrmModule } from '@mikro-orm/nestjs';
import { forwardRef, Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { User } from './entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PhoneNumbersModule } from './phone-numbers/phone-numbers.module';
import { EmailsModule } from './emails/emails.module';

@Module({
    imports: [
        PhoneNumbersModule,
        EmailsModule,
        MikroOrmModule.forFeature([User]),
        forwardRef(() => PostsModule),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
