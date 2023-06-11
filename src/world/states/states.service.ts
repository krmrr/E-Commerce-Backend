import { BadRequestException, Injectable } from '@nestjs/common';
import {
    FilterOperator,
    paginate,
    PaginateQuery,
    RelationColumn,
} from '../../utils/paginate';
import { State } from './entities';
import { EntityRepository, expr, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

interface FindAllArgs {
    name?: string;
    countryId?: number;
    countryCode?: string;
    type?: string;
    iso2?: string;
    relations?: RelationColumn<State>[];
}

interface FindOneArgs extends FindAllArgs {
    id: number;
    name?: string;
}

@Injectable()
export class StatesService {
    constructor(
        @InjectRepository(State)
        private statesRepository: EntityRepository<State>,
    ) {}

    findAll(args?: FindAllArgs, query?: PaginateQuery) {
        const { relations, countryId } = args || {};

        let where: FilterQuery<State> = {};
        if (countryId) {
            where = { country: countryId };
        }

        return paginate(query, this.statesRepository, {
            sortableColumns: [
                'name',
                'countryCode',
                'country',
                'type',
                'latitude',
                'longitude',
            ],
            searchableColumns: ['name', 'iso2'],
            defaultSortBy: [['createdAt', 'desc']],
            filterableColumns: {
                name: [FilterOperator.LIKE, FilterOperator.EQ],
                countryCode: [FilterOperator.EQ],
                iso2: [FilterOperator.EQ],
                wikiDataId: [FilterOperator.EQ],
                type: [FilterOperator.EQ, FilterOperator.LIKE],
                fipsCode: [FilterOperator.EQ],
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
            defaultLimit: 20,
            maxLimit: 50,
            relations,
            where,
        });
    }

    findOne({
        id,
        name,
        countryId,
        countryCode,
        type,
        relations,
        iso2,
    }: FindOneArgs) {
        let where: FilterQuery<State> = {};

        if (id) {
            where = id;
        } else if (name) {
            where = { [expr('lower(name)')]: name.toLowerCase() };
        } else if (countryId) {
            where = { country: countryId };
        } else if (countryCode) {
            where = { countryCode };
        } else if (type) {
            where = { type };
        } else if (iso2) {
            where = { iso2 };
        } else {
            throw new BadRequestException(
                'One of id, name, countryId, countryCode, type or iso2 must be provided',
            );
        }

        return this.statesRepository.findOne(where, { populate: relations });
    }
}
