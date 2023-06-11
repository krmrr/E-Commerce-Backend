import { Controller } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { Paginate, PaginateQuery } from '../../utils/paginate';
import { HashedRouteParam } from '../../utils/hashids';
import { Get } from '../../utils/nestia';
import { Country } from './entities';

@Controller('api/countries')
export class CountriesController {
    static entity = Country;

    constructor(private readonly countriesService: CountriesService) {}

    @Get()
    findAll(@Paginate() query: PaginateQuery) {
        return this.countriesService.findAll(undefined, query);
    }

    @Get(':id')
    findOne(@HashedRouteParam('id') id: number) {
        return this.countriesService.findOne({ id });
    }
}
