import { Module } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CitiesController } from './cities.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { City } from './entities';

@Module({
    imports: [MikroOrmModule.forFeature([City])],
    controllers: [CitiesController],
    providers: [CitiesService],
})
export class CitiesModule {}
