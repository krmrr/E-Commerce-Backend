import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { flatten, isEmpty, isString } from 'lodash';
import { PaginateQuery } from './types';

export const Paginate = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): PaginateQuery => {
        const request: Request = ctx.switchToHttp().getRequest();
        const { query } = request;
        const filter = query.filter ?? {};

        // Determine if Express or Fastify to rebuild the original url and reduce down to protocol, host and base url
        let originalUrl;
        if (request.originalUrl) {
            originalUrl =
                request.protocol +
                '://' +
                request.get('host') +
                request.originalUrl;
        } else {
            originalUrl =
                request.protocol + '://' + request.hostname + request.url;
        }
        const urlParts = new URL(originalUrl);
        const path =
            urlParts.protocol + '//' + urlParts.host + urlParts.pathname;

        const sortBy: [string, 'asc' | 'desc'][] = [];
        const searchBy: string[] = [];
        if (query.sort) {
            const params = (
                !Array.isArray(query.sort) ? [query.sort] : flatten(query.sort)
            )
                .join(',')
                .trim();

            if (!isEmpty(params)) {
                const items = params.split(',');

                for (const item of items) {
                    let direction: 'asc' | 'desc' = 'asc';
                    let columnName = item;
                    if (columnName.startsWith('-')) {
                        direction = 'desc';
                        columnName = columnName.substring(1);
                    }
                    sortBy.push([columnName, direction]);
                }
            }
        }

        if (query.searchBy) {
            const params = !Array.isArray(query.searchBy)
                ? [query.searchBy]
                : query.searchBy;
            for (const param of params) {
                if (isString(param)) {
                    searchBy.push(param as string);
                }
            }
        }

        return {
            page: query.page ? parseInt(query.page.toString(), 10) : undefined,
            limit: query.limit
                ? parseInt(query.limit.toString(), 10)
                : undefined,
            sort: sortBy.length ? sortBy : undefined,
            search: query.search ? query.search.toString() : undefined,
            searchBy: searchBy.length ? searchBy : undefined,
            filter: Object.keys(filter).length ? filter : undefined,
            path,
        };
    },
);
