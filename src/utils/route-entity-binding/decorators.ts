import {
    applyDecorators,
    createParamDecorator,
    ExecutionContext,
    SetMetadata,
    UseGuards,
} from '@nestjs/common';
import { Pipes } from '../hashids';
import { RouteEntitiesGuard } from './guard';
import { Entity } from '../../config/mikro-orm.config';
import flat from 'flat';

export const ROUTE_KEY = Symbol('routeKey');
export const ROUTE_ENTITIES_KEY = Symbol('routeEntities');

export type ResolveEntitiesPayload =
    // [key: string] is needed to make it compatible with flat
    | { [key: string]: Entity }
    | {
          params?: {
              [key: string]: Entity;
          };
          query?: {
              [key: string]: Entity;
          };
      };

export interface ResolveEntitiesOptions {
    showSoftDeleted?: boolean;
}

export interface RouteEntitiesPayload {
    entities: ResolveEntitiesPayload;
    options?: ResolveEntitiesOptions;
}

export function RouteKey() {
    return (target: Object, propertyKey: string | symbol) => {
        const entity = target.constructor;
        Reflect.defineMetadata(ROUTE_KEY, propertyKey, entity);
    };
}

export const RouteEntity = (property: string, ...pipes: Pipes) => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        return createParamDecorator(
            async (data: string, ctx: ExecutionContext) => {
                const request: Request = ctx.switchToHttp().getRequest();

                const entityType = Reflect.getMetadata(
                    'design:paramtypes',
                    target,
                    propertyKey,
                )[parameterIndex];
                const parameter = (request as any).params[property];

                const preloadedEntity = (request as any).entities?.params[
                    property
                ];

                if (preloadedEntity) {
                    return preloadedEntity;
                }

                return await entityType.prototype.resolveRouteEntity(parameter);
            },
        )(...pipes)(target, propertyKey, parameterIndex);
    };
};

export const QueryEntity = (property: string, ...pipes: Pipes) => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        return createParamDecorator(
            async (data: string, ctx: ExecutionContext) => {
                const request: Request = ctx.switchToHttp().getRequest();

                const entityType = Reflect.getMetadata(
                    'design:paramtypes',
                    target,
                    propertyKey,
                )[parameterIndex];
                const parameter = (request as any).query[property];

                const preloadedEntity = (request as any).entities?.query[
                    property
                ];

                if (preloadedEntity) {
                    return preloadedEntity;
                }

                return await entityType.prototype.resolveRouteEntity(parameter);
            },
        )(...pipes)(target, propertyKey, parameterIndex);
    };
};

export const ResolveEntities = (
    payload: ResolveEntitiesPayload,
    options: ResolveEntitiesOptions = {},
) => {
    return <TFunction extends Function, Y>(
        target: object | TFunction,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<Y>,
    ) => {
        const entities = flat.unflatten(payload);
        return applyDecorators(
            UseGuards(RouteEntitiesGuard),
            SetMetadata(ROUTE_ENTITIES_KEY, { entities, options }),
        )(target, propertyKey, descriptor);
    };
};
