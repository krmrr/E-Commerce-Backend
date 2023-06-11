import { Module } from '@nestjs/common';
import { StatesService } from './states.service';
import { StatesController } from './states.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { State } from './entities';

@Module({
    imports: [MikroOrmModule.forFeature([State])],
    controllers: [StatesController],
    providers: [StatesService],
})
export class StatesModule {}
