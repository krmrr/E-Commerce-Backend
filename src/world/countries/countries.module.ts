import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Country } from './entities';

@Module({
    imports: [MikroOrmModule.forFeature([Country])],
    controllers: [CountriesController],
    providers: [CountriesService],
})
export class CountriesModule {}
