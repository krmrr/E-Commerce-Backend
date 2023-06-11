import { Controller } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { Paginate, PaginateQuery } from '../../utils/paginate';
import { HashedQueryParam, HashedRouteParam } from '../../utils/hashids';
import { Get } from '../../utils/nestia';
import { City } from './entities';
import { Country } from '../countries/entities';
import { State } from '../states/entities';

@Controller('api/cities')
export class CitiesController {
    static entity = City;

    constructor(private readonly citiesService: CitiesService) {}

    @Get()
    findAll(
        @Paginate() paginateQuery: PaginateQuery,
        @HashedQueryParam({
            property: 'countryId',
            entity: Country,
        })
        countryId?: number,
        @HashedQueryParam({
            property: 'stateId',
            entity: State,
        })
        stateId?: number,
    ) {
        return this.citiesService.findAll(
            { countryId, stateId },
            paginateQuery,
        );
    }

    @Get(':id')
    findOne(@HashedRouteParam('id') id: number) {
        return this.citiesService.findOne({ id });
    }
}
