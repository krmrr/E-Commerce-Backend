import { Module } from '@nestjs/common';
import { CountriesModule } from './countries/countries.module';
import { StatesModule } from './states/states.module';
import { CitiesModule } from './cities/cities.module';

@Module({
    imports: [CountriesModule, StatesModule, CitiesModule],
})
export class WorldModule {}
