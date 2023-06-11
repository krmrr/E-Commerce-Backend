import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Country } from './entities';
import { EntityRepository, expr, FilterQuery } from '@mikro-orm/core';
import {
    FilterOperator,
    paginate,
    PaginateQuery,
    RelationColumn,
} from '../../utils/paginate';

interface FindAllArgs {
    relations?: RelationColumn<Country>[];
}

interface FindOneArgs extends FindAllArgs {
    id: number;
    iso2?: string;
    iso3?: string;
    numericCode?: string;
    phoneCode?: string;
    wikiDataId?: string;
    name?: string;
}

@Injectable()
export class CountriesService {
    constructor(
        @InjectRepository(Country)
        private countriesRepository: EntityRepository<Country>,
    ) {}

    findAll(args?: FindAllArgs, query?: PaginateQuery) {
        const { relations } = args || {};

        return paginate(query, this.countriesRepository, {
            sortableColumns: [
                'name',
                'native',
                'iso3',
                'numericCode',
                'iso2',
                'phoneCode',
                'wikiDataId',
                'createdAt',
            ],
            searchableColumns: ['name', 'native', 'iso3', 'iso2'],
            defaultSortBy: [['createdAt', 'desc']],
            filterableColumns: {
                name: [FilterOperator.LIKE, FilterOperator.EQ],
                native: [FilterOperator.LIKE, FilterOperator.EQ],
                iso2: [FilterOperator.EQ],
                iso3: [FilterOperator.EQ],
                numericCode: [FilterOperator.EQ],
                phoneCode: [FilterOperator.EQ],
                wikiDataId: [FilterOperator.EQ],
                latitude: [
                    FilterOperator.GTE,
                    FilterOperator.LTE,
                    FilterOperator.BTW,
                ],
                longitude: [
                    FilterOperator.GTE,
                    FilterOperator.LTE,
                    FilterOperator.BTW,
                ],
                currencySymbol: [FilterOperator.EQ],
                currencyName: [FilterOperator.EQ, FilterOperator.LIKE],
            },
            defaultLimit: 20,
            maxLimit: 50,
            relations,
        });
    }

    findOne({
        id,
        iso2,
        iso3,
        numericCode,
        phoneCode,
        wikiDataId,
        name,
        relations,
    }: FindOneArgs) {
        let where: FilterQuery<Country> = {};

        if (id) {
            where = id;
        } else if (iso2) {
            where = { iso2 };
        } else if (iso3) {
            where = { iso3 };
        } else if (numericCode) {
            where = { numericCode };
        } else if (phoneCode) {
            where = { phoneCode };
        } else if (wikiDataId) {
            where = { wikiDataId };
        } else if (name) {
            where = { [expr('lower(name)')]: name.toLowerCase() };
        } else {
            throw new BadRequestException(
                'One of iso2, iso3, numericCode, phoneCode, wikiDataId or name must be provided',
            );
        }

        return this.countriesRepository.findOne(where, {
            populate: relations,
        });
    }
}
