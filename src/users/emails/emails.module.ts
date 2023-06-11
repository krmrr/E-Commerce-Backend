import { Global, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Email } from './entities';
import { EmailsWebController } from './emails-web.controller';

@Global()
@Module({
    imports: [MikroOrmModule.forFeature([Email])],
    controllers: [EmailsController, EmailsWebController],
    providers: [EmailsService],
    exports: [EmailsService],
})
export class EmailsModule {}
