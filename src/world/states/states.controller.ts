import { StatesService } from './states.service';
import { Paginate, PaginateQuery } from '../../utils/paginate';
import { HashedQueryParam, HashedRouteParam } from '../../utils/hashids';
import { Get } from '../../utils/nestia';
import { Controller } from '@nestjs/common';
import { State } from './entities';
import { Country } from '../countries/entities';

@Controller('api/states')
export class StatesController {
    static entity = State;

    constructor(private readonly statesService: StatesService) {}

    @Get()
    findAll(
        @Paginate() query: PaginateQuery,
        @HashedQueryParam({
            property: 'countryId',
            entity: Country,
        })
        countryId?: number,
    ) {
        return this.statesService.findAll({ countryId }, query);
    }

    @Get(':id')
    findOne(@HashedRouteParam('id') id: number) {
        return this.statesService.findOne({ id });
    }
}
