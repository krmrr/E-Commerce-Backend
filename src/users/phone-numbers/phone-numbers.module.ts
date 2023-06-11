import { Module } from '@nestjs/common';
import { PhoneNumbersService } from './phone-numbers.service';
import { PhoneNumbersController } from './phone-numbers.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PhoneNumber } from './entities';

@Module({
    imports: [MikroOrmModule.forFeature([PhoneNumber])],
    controllers: [PhoneNumbersController],
    providers: [PhoneNumbersService],
})
export class PhoneNumbersModule {}
