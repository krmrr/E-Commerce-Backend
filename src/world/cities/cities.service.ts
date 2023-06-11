import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { City } from './entities';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import {
    FilterOperator,
    paginate,
    PaginateQuery,
    RelationColumn,
} from '../../utils/paginate';

interface FindAllArgs {
    stateId?: number;
    stateCode?: string;
    countryId?: number;
    countryCode?: string;
    relations?: RelationColumn<City>[];
}

interface FindOneArgs extends FindAllArgs {
    id: number;
    name?: string;
    wikiDataId?: string;
}

@Injectable()
export class CitiesService {
    constructor(
        @InjectRepository(City)
        private citiesRepository: EntityRepository<City>,
    ) {}

    findAll(args?: FindAllArgs, query?: PaginateQuery) {
        const { relations, stateId, countryId } = args || {};

        let where: FilterQuery<City> = {};
        if (stateId) {
            where = { ...where, state: stateId };
        }
        if (countryId) {
            where = { ...where, country: countryId };
        }

        return paginate(query, this.citiesRepository, {
            sortableColumns: [
                'name',
                'stateCode',
                'state',
                'countryCode',
                'country',
                'latitude',
                'longitude',
            ],
            searchableColumns: ['name'],
            defaultSortBy: [['createdAt', 'desc']],
            filterableColumns: {
                name: [FilterOperator.LIKE, FilterOperator.EQ],
                stateCode: [FilterOperator.EQ],
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
            },
            where,
            relations,
        });
    }

    findOne({
        id,
        name,
        wikiDataId,
        stateId,
        stateCode,
        countryId,
        countryCode,
        relations,
    }: FindOneArgs) {
        let where: FilterQuery<City> = {};

        if (id) {
            where = id;
        } else if (name) {
            where = { name };
        } else if (wikiDataId) {
            where = { wikiDataId };
        } else if (stateId) {
            where = { state: stateId };
        } else if (stateCode) {
            where = { stateCode };
        } else if (countryId) {
            where = { country: countryId };
        } else if (countryCode) {
            where = { countryCode };
        } else {
            throw new BadRequestException(
                'You must specify one of the following: id, name, wikiDataId, stateId, stateCode, countryId, countryCode',
            );
        }

        return this.citiesRepository.findOne(where, { populate: relations });
    }
}
