import {
    Column,
    FilterOperator,
    PaginateConfig,
    PaginateQuery,
    SortBy,
} from './types';
import { ServiceUnavailableException } from '@nestjs/common';
import { fromPairs, isBoolean, isEmpty, values } from 'lodash';
import { EntityRepository, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import type { FindOptions } from '@mikro-orm/core/drivers';
import merge from 'ts-deepmerge';
import { SOFT_DELETABLE_FILTER } from 'mikro-orm-soft-delete';
import qs, { ParsedQs } from 'qs';
import flat from 'flat';

export class Paginated<T> {
    data: T[];
    meta: {
        itemsPerPage: number;
        totalItems: number;
        currentPage: number;
        totalPages: number;
        sort: SortBy<T>;
        searchBy: Column<T>[];
        search: string;
        filter?: string | ParsedQs | string[] | ParsedQs[];
    };
    links: {
        first?: string;
        previous?: string;
        self: string;
        next?: string;
        last?: string;
    };
}

export function isOperator(value: unknown): value is FilterOperator {
    return values(FilterOperator).includes(value as any);
}

export function getFilterTokens(raw: string): string[] {
    const tokens = [];
    const matches = raw.match(/(\$\w+):/g);

    if (matches) {
        const value = raw.replace(matches.join(''), '');
        if (value !== FilterOperator.NULL) {
            tokens.push(
                ...matches.map((token) => token.substring(0, token.length - 1)),
                value,
            );
        }
    } else {
        tokens.push(raw);
    }

    if (tokens.length === 0 || tokens.length > 3) {
        return [];
    } else if (tokens.length === 1) {
        if (![FilterOperator.NULL, FilterOperator.NNULL].includes(tokens[0])) {
            tokens.unshift(FilterOperator.EQ);
        }
    }

    return tokens;
}

function parseFilter<T>(query: PaginateQuery, config: PaginateConfig<T>) {
    const filter: FilterQuery<T> = {} as any;
    const passedFilter = {};
    for (const column of Object.keys(query.filter)) {
        if (!(column in config.filterableColumns)) {
            continue;
        }
        const allowedOperators = config.filterableColumns[column];
        const input = query.filter[column];
        const statements = !Array.isArray(input) ? [input] : input;
        for (const raw of statements) {
            const tokens = getFilterTokens(raw);
            if (tokens.length === 0) {
                continue;
            }
            const [op, value] = tokens;
            if (!isOperator(op) || !allowedOperators.includes(op)) {
                continue;
            }
            if (isOperator(op)) {
                passedFilter[column] = [...(passedFilter[column] ?? []), raw];
                switch (op) {
                    case FilterOperator.BTW:
                        const values = value.split(',').sort();
                        filter[column] = {
                            ...filter[column],
                            [FilterOperator.GTE]: values[0],
                            [FilterOperator.LTE]: values[1],
                        };
                        break;
                    case FilterOperator.IN:
                        filter[column] = {
                            ...filter[column],
                            [op]: value.split(','),
                        };
                        break;
                    case FilterOperator.NULL:
                        filter[column] = {
                            ...filter[column],
                            [FilterOperator.EQ]: null,
                        };
                        break;
                    case FilterOperator.NNULL:
                        filter[column] = {
                            ...filter[column],
                            [FilterOperator.NE]: null,
                        };
                        break;
                    default:
                        filter[column] = { ...filter[column], [op]: value };
                        break;
                }
            }
        }
        if (passedFilter[column] && !Array.isArray(input)) {
            passedFilter[column] = passedFilter[column][0];
        }
    }
    return [filter, passedFilter];
}

export async function paginate<T>(
    query: PaginateQuery,
    repo: EntityRepository<T>,
    config: PaginateConfig<T>,
): Promise<Paginated<T>> {
    let options: FindOptions<T> = {};
    let where: FilterQuery<any> = {} as FilterQuery<any>;
    let page = query.page || 1;
    config.filterableColumns =
        config.filterableColumns ||
        ([] as PaginateConfig<T>['filterableColumns']);

    const limit = Math.min(
        query.limit || config.defaultLimit || 20,
        config.maxLimit || 100,
    );
    const offset = (page - 1) * limit;
    const sortBy = [] as SortBy<T>;
    const searchBy: Column<T>[] = [];
    const path = query.path;
    let passedFilter: typeof query.filter = {};

    options.limit = limit;
    options.offset = offset;

    function isEntityKey(
        entityColumns: Column<T>[],
        column: string,
    ): column is Column<T> {
        return !!entityColumns.find((c) => c === column);
    }

    if (config.sortableColumns.length < 1)
        throw new ServiceUnavailableException();

    if (query.sort) {
        for (const order of query.sort) {
            if (
                isEntityKey(config.sortableColumns, order[0]) &&
                ['asc', 'desc'].includes(order[1])
            ) {
                sortBy.push([order[0], order[1]]);
            }
        }
    }

    if (isEmpty(sortBy)) {
        const fallbackSortBy = config.defaultSortBy || [
            [config.sortableColumns[0], 'asc'],
        ];
        sortBy.push(...fallbackSortBy);
    }

    if (config.searchableColumns) {
        if (query.searchBy) {
            for (const column of query.searchBy) {
                if (isEntityKey(config.searchableColumns, column)) {
                    searchBy.push(column);
                }
            }
        } else {
            searchBy.push(...config.searchableColumns);
        }
    }

    if (page < 1) page = 1;
    const queryBuilder = repo;

    if (config.relations?.length) {
        // @ts-ignore
        options.populate = [
            ...(isEmpty(options.populate) || isBoolean(options.populate)
                ? []
                : Array.isArray(options.populate)
                ? options.populate
                : [options.populate]),
            ...config.relations,
        ];
    }

    if (!isEmpty(sortBy)) {
        options.orderBy = fromPairs(sortBy) as
            | (QueryOrderMap<T> & { '0'?: never })
            | QueryOrderMap<T>[];
    }
    if (config.where) {
        where = {
            $and: [config.where, where],
        };
    }

    if (config.withDeleted) {
        options = merge(options, {
            filters: { [SOFT_DELETABLE_FILTER]: false },
        });
    }

    if (query.search && searchBy.length) {
        const search = query.search.toLowerCase();

        const searchQuery = searchBy.map((column) => {
            return {
                [column]: {
                    $like: `%${search}%`,
                },
            };
        });

        where = merge(where, {
            $or: searchQuery,
        });
    }

    if (query.filter) {
        const [filter, passed] = parseFilter(query, config);
        passedFilter = passed;
        where = merge(where, { $and: [filter] });
    }

    where = flat.unflatten(where);

    const [items, totalItems] = await queryBuilder.findAndCount(where, options);

    let totalPages = totalItems / limit;
    if (totalItems % limit) totalPages = Math.ceil(totalPages);

    const sortByQuery = `&sort=${sortBy
        .map((order) => (order[1] === 'desc' ? '-' : '') + order[0])
        .join(',')}`;
    const searchQuery = query.search ? `&search=${query.search}` : '';

    const searchByQuery =
        query.searchBy && searchBy.length
            ? searchBy.map((column) => `&searchBy=${column}`).join('')
            : '';

    const filterQuery = query.filter
        ? '&' + qs.stringify({ filter: passedFilter }, { encode: false })
        : '';

    const queryOptions = `&limit=${limit}${sortByQuery}${searchQuery}${searchByQuery}${filterQuery}`;

    const buildLink = (p: number): string => path + '?page=' + p + queryOptions;

    const results: Paginated<T> = {
        data: items,
        meta: {
            itemsPerPage: limit,
            totalItems,
            currentPage: page,
            totalPages: totalPages,
            sort: sortBy,
            search: query.search,
            searchBy: query.search ? searchBy : undefined,
            filter: passedFilter,
        },
        links: {
            first: page == 1 ? undefined : buildLink(1),
            previous: page - 1 < 1 ? undefined : buildLink(page - 1),
            self: buildLink(page),
            next: page + 1 > totalPages ? undefined : buildLink(page + 1),
            last:
                page == totalPages || !totalItems
                    ? undefined
                    : buildLink(totalPages),
        },
    };

    return Object.assign(new Paginated<T>(), results);
}
