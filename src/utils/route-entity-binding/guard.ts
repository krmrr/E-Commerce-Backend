import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ROUTE_ENTITIES_KEY, RouteEntitiesPayload } from './decorators';
import { Entity } from '../../config/mikro-orm.config';
import { BaseEntity } from '../../database/entities';

@Injectable()
export class RouteEntitiesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const routeEntitiesPayload = this.reflector.get<RouteEntitiesPayload>(
            ROUTE_ENTITIES_KEY,
            context.getHandler(),
        );

        const routeEntities = routeEntitiesPayload?.entities ?? {};
        const routeEntitiesOptions = routeEntitiesPayload?.options ?? {};

        const request: Request = context.switchToHttp().getRequest();
        if (!(request as any).entities) {
            (request as any).entities = {
                params: {},
                query: {},
            };
        }

        const promises = [];
        const promiseInformations = [];

        function createEntityPromises(source: 'query' | 'params') {
            Object.entries(routeEntities[source] ?? {}).map(([key, value]) => {
                const entityClass = value as Entity;
                if (!(entityClass.prototype instanceof BaseEntity)) {
                    throw new Error(`Invalid route param value for: "${key}".`);
                }
                const payload = request[source][key] as string;

                const entity = entityClass.prototype.resolveRouteEntity(
                    payload,
                    routeEntitiesOptions.showSoftDeleted ?? false,
                );

                promises.push(entity);
                promiseInformations.push({
                    source,
                    key,
                });
            });
        }

        createEntityPromises('params');
        createEntityPromises('query');

        if (promises.length > 0) {
            const entities = await Promise.all(promises);

            entities.map((entity, index) => {
                const { source, key } = promiseInformations[index];
                (request as any).entities[source][key] = entity;
            });
        }

        return true;
    }
}
