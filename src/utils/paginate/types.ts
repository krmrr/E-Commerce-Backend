import { FilterQuery } from '@mikro-orm/core';
import { ParsedQs } from 'qs';

type Join<K, P> = K extends string
    ? P extends string
        ? `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export type Column<T, D extends number = 2> = [D] extends [never]
    ? never
    : T extends Record<string, any>
    ? {
          [K in keyof T]-?: K extends string
              ? T[K] extends Date
                  ? `${K}`
                  : T[K] extends Array<infer U>
                  ? `${K}` | Join<K, Column<U, Prev[D]>>
                  : `${K}` | Join<K, Column<T[K], Prev[D]>>
              : never;
      }[keyof T]
    : '';

export type RelationColumn<T> = Extract<
    Column<T>,
    {
        [K in Column<T>]: K extends `${infer R}.${string}` ? R : never;
    }[Column<T>]
>;

export type Order<T> = [Column<T>, 'asc' | 'desc'];
export type SortBy<T> = Order<T>[];

export interface Dictionary<T> {
    [index: string]: T;
}

export interface PaginateQuery {
    page?: number;
    limit?: number;
    sort?: [string, 'asc' | 'desc'][];
    searchBy?: string[];
    search?: string;
    filter?: string | ParsedQs | string[] | ParsedQs[];
    path: string;
}

export interface PaginateConfig<T> {
    relations?: RelationColumn<T>[];
    sortableColumns: Column<T>[];
    searchableColumns?: Column<T>[];
    maxLimit?: number;
    defaultSortBy?: SortBy<T>;
    defaultLimit?: number;
    where?: FilterQuery<T> | FilterQuery<T>[];
    filterableColumns?: { [key in Column<T>]?: FilterOperator[] };
    withDeleted?: boolean;
}

export enum FilterOperator {
    EQ = '$eq',
    GT = '$gt',
    GTE = '$gte',
    IN = '$in',
    LT = '$lt',
    LTE = '$lte',
    NE = '$ne',
    NIN = '$nin',
    LIKE = '$like',
    RE = '$re',
    ILIKE = '$ilike',
    OVERLAP = '$overlap',
    CONTAINS = '$contains',
    CONTAINED = '$contained',
    NULL = '$null',
    BTW = '$btw',
    NNULL = '$nnull',
}
