import {
    applyDecorators,
    BadRequestException,
    createParamDecorator,
    ExecutionContext,
    PipeTransform,
} from '@nestjs/common';
import { PrimaryKey, Property } from '@mikro-orm/core';
import {
    createHashidsInstance,
    hashids as appHashids,
    HASHIDS,
    hashidsConfig as appHashidsConfig,
    hashidsSerializer,
    IHashidsConfig,
    isHashedId,
} from './index';
import { Type } from '@nestjs/common/interfaces';
import { IHashedId, IHashedRoutePayload } from './types';
import { Entity } from '../../config/mikro-orm.config';
import { BaseEntity } from '../../database/entities';
import { ValidationOptions } from 'class-validator/types/decorator/ValidationOptions';
import {
    IsDefined,
    IsString,
    MinLength,
    Validate,
    ValidationArguments,
    ValidatorConstraintInterface,
} from 'class-validator';
import { env } from '../../config/environment';
import { isNil } from 'lodash';

export type Pipes = (Type<PipeTransform> | PipeTransform)[];

export function HashedId(options?: IHashedId) {
    return (target: Object, propertyKey: string | symbol) => {
        const entityName = target.constructor.name;
        const config = {
            ...appHashidsConfig.default,
            ...(options?.hashids ?? {}),
        };
        const salt =
            ((options ?? {}).hashids ?? {})?.salt ??
            (target.constructor as any).hashidsSalt ??
            config.salt + '-' + entityName;
        config.salt = salt;

        const serializerOptions = {
            serializer: (payload: any) =>
                hashidsSerializer(payload, config as IHashidsConfig),
        };
        const mergedOptions = {
            ...{ primaryKey: true, unsigned: true },
            ...serializerOptions,
            ...(options ?? {}),
        };

        // Sometimes entities can't get created because of undefined primary key error. To avoid this, we set autoincrement
        // to true by default on primary key.
        if (
            mergedOptions.primaryKey &&
            mergedOptions.autoincrement === undefined
        ) {
            mergedOptions.autoincrement = true;
        }

        const primaryKey = mergedOptions.primaryKey;

        Reflect.defineMetadata(
            HASHIDS,
            config,
            target.constructor,
            propertyKey,
        );

        const classMetadata = [
            ...(Reflect.getMetadata(HASHIDS, target.constructor) ?? []),
        ];
        if (!classMetadata.includes(propertyKey)) {
            classMetadata.push(propertyKey);
        }
        Reflect.defineMetadata(HASHIDS, classMetadata, target.constructor);

        delete mergedOptions.primaryKey;
        delete mergedOptions.hashids;

        const MainDecorator = primaryKey ? PrimaryKey : Property;

        return MainDecorator(mergedOptions)(target, propertyKey as string);
    };
}

function parseHashidFromRequest(
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
    payload: IHashedRoutePayload,
    source: 'params' | 'query',
    ctx: ExecutionContext,
) {
    const request: Request = ctx.switchToHttp().getRequest();

    const property = typeof payload === 'string' ? payload : payload.property;
    const parameter = (request as any)[source][property];
    if (isNil(parameter)) return null;

    let entityType: Entity;
    const paramType = Reflect.getMetadata(
        'design:paramtypes',
        target,
        propertyKey,
    )[parameterIndex];
    const paramTypeIsEntity = paramType.prototype instanceof BaseEntity;
    if (!paramTypeIsEntity) {
        entityType =
            typeof payload === 'object'
                ? ((
                      payload as {
                          property: string;
                          hashids?: IHashidsConfig;
                          entity?: false | Entity;
                      }
                  )?.entity as Entity)
                : undefined;
        entityType = entityType ?? (target.constructor as any).entity;
    } else {
        entityType = paramType as Entity;
    }
    if (typeof payload === 'object' && payload?.entity === false) {
        entityType = null;
    }
    if (paramTypeIsEntity) {
        const preloadedEntity = (request as any).entities?.[source][property];

        if (preloadedEntity) {
            return preloadedEntity;
        }
        const repository = paramType.prototype.repository();
        return repository.findOneByHashid(parameter);
    } else {
        const hashids = entityType
            ? entityType?.prototype?.hashids()
            : typeof payload === 'object' && payload?.hashids
            ? createHashidsInstance(payload.hashids)
            : appHashids;
        const decoded = hashids.decode(parameter);
        if (decoded === undefined) {
            throw new BadRequestException('Invalid identifier provided');
        }
        return hashids.decode(parameter);
    }
}

export const HashedRouteParam = (
    payload: IHashedRoutePayload,
    ...pipes: Pipes
) => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        return createParamDecorator((data: string, ctx: ExecutionContext) => {
            return parseHashidFromRequest(
                target,
                propertyKey,
                parameterIndex,
                payload,
                'params',
                ctx,
            );
        })(...pipes)(target, propertyKey, parameterIndex);
    };
};

export const HashedQueryParam = (
    payload: IHashedRoutePayload,
    ...pipes: Pipes
) => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number,
    ) => {
        return createParamDecorator((data: string, ctx: ExecutionContext) => {
            return parseHashidFromRequest(
                target,
                propertyKey,
                parameterIndex,
                payload,
                'query',
                ctx,
            );
        })(...pipes)(target, propertyKey, parameterIndex);
    };
};

export const IsHashedId = (
    stringValidationOptions?: ValidationOptions,
    minLengthValidationOptions?: ValidationOptions,
) => {
    const decorators = [
        IsString(stringValidationOptions),
        MinLength(env.HASHIDS_LENGTH ?? 8, minLengthValidationOptions),
    ];
    return applyDecorators(...decorators);
};

export class IsHashedIdOrHashedIdArrayValidationConstraint
    implements ValidatorConstraintInterface
{
    validate(text: string | string[], args: ValidationArguments) {
        return Array.isArray(text) ? text.every(isHashedId) : isHashedId(text);
    }

    defaultMessage(args: ValidationArguments) {
        return '($property) must be a hashed string or a hashed string array';
    }
}

export class IsHashedIdArrayValidationConstraint
    implements ValidatorConstraintInterface
{
    validate(text: string | string[], args: ValidationArguments) {
        return Array.isArray(text) && text.every(isHashedId);
    }

    defaultMessage(args: ValidationArguments) {
        return '($property) must be a hashed string array';
    }
}

export function IsHashedIdOrHashedIdArray() {
    return applyDecorators(
        IsDefined(),
        Validate(IsHashedIdOrHashedIdArrayValidationConstraint),
    );
}

export function IsHashedIdArray() {
    return applyDecorators(
        IsDefined(),
        Validate(IsHashedIdArrayValidationConstraint),
    );
}
