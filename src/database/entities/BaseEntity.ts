import {
    BaseEntity as DefaultBaseEntity,
    EntityMetadata,
    FilterQuery,
    RequestContext,
} from '@mikro-orm/core';
import { Entity, getEntityName } from '../../config/mikro-orm.config';
import { SqlEntityManager } from '@mikro-orm/knex';
import { SOFT_DELETABLE, SOFT_DELETABLE_FILTER } from 'mikro-orm-soft-delete';
import {
    createHashidsInstance,
    HASHIDS,
    hashidsConfig as appHashidsConfig,
} from '../../utils/hashids';
import { BaseRepository } from '../repositories';
import { ROUTE_KEY } from '../../utils/route-entity-binding';

export abstract class BaseEntity<
    T extends InstanceType<Entity>,
    PK extends keyof T,
> extends DefaultBaseEntity<T, PK> {
    static hashidsSalt?: string;

    static repository(entityName?: string, customEm?: SqlEntityManager) {
        const em = customEm ?? BaseEntity.em();
        return em.getRepository(
            entityName ?? this.name,
        ) as unknown as BaseRepository<any>;
    }

    static em() {
        return RequestContext.getEntityManager() as unknown as SqlEntityManager;
    }

    static ormMetadata() {
        return BaseEntity.em()?.getMetadata();
    }

    static entityMetadata(entityName?: string) {
        return BaseEntity.ormMetadata()?.find(entityName ?? this.name);
    }

    static encodeToHashedId(value: number, entityName?: string) {
        const hashids = BaseEntity.hashids(entityName ?? this.name);
        return hashids.encode(value);
    }

    static decodeHashedId(hashid: string, entityName?: string) {
        const hashids = BaseEntity.hashids(entityName ?? this.name);
        return hashids.decode(hashid);
    }

    static getHashidsConfig(customEntityName?: string) {
        const entityName = customEntityName ?? this.name;
        const primaryKeyField = BaseEntity.getPrimaryKeyField(
            customEntityName,
            true,
        ) as string | null;

        let config;
        if (primaryKeyField) {
            config = Reflect.getMetadata(
                HASHIDS,
                this.constructor,
                primaryKeyField,
            );
            if (config) return config;
        }

        config = { ...appHashidsConfig.default };
        const salt = config.salt + '-' + entityName;
        config.salt = salt;

        return config;
    }

    static hashids(customEntityName?: string) {
        const config = BaseEntity.getHashidsConfig(
            customEntityName ?? this.name,
        );
        const hashids = createHashidsInstance(config);
        return hashids;
    }

    static getPrimaryKeyField(
        entityName?: string,
        returnNullIfArray = false,
    ): null | string | string[] {
        const entityMetadata = BaseEntity.entityMetadata(
            entityName ?? this.name,
        );
        const primaryKeyFields: string[] = entityMetadata?.primaryKeys;

        if (primaryKeyFields?.length > 1) {
            if (primaryKeyFields.includes('id')) {
                return 'id';
            } else if (returnNullIfArray) {
                return null;
            } else {
                return primaryKeyFields;
            }
        }
        return primaryKeyFields?.[0];
    }

    hashids() {
        return BaseEntity.hashids(this.constructor.name);
    }

    repository() {
        return BaseEntity.repository(
            this.constructor.name,
        ) as unknown as BaseRepository<T>;
    }

    em() {
        return BaseEntity.em();
    }

    ormMetadata() {
        return BaseEntity.ormMetadata();
    }

    entityMetadata() {
        return BaseEntity.entityMetadata(
            this.constructor.name,
        ) as EntityMetadata<T>;
    }

    async restore(where?: FilterQuery<T>) {
        if (!where && this.hasOwnProperty('id')) {
            where = {
                // @ts-ignore
                id: this.id,
            };
        }
        if (!where) {
            throw new Error('Cannot restore without where clause or id');
        }
        const softDeletableMetadata = Reflect.getMetadata(
            SOFT_DELETABLE,
            this.constructor,
        );
        if (!softDeletableMetadata) {
            throw new Error('Cannot restore entity that is not soft deletable');
        }
        const deletedAtField = softDeletableMetadata.field;
        const entityName = getEntityName(this as unknown as Entity);
        where = {
            ...(where as object),
            [deletedAtField]: { $ne: null },
        } as FilterQuery<T>;
        const isSuccess = !!(await BaseEntity.em().nativeUpdate(
            entityName,
            where,
            // @ts-ignore
            { [deletedAtField]: null },
            { filters: { [SOFT_DELETABLE_FILTER]: false } },
        ));
        if (!isSuccess) {
            throw new Error('Cannot restore entity that is not soft deleted');
        }
        await BaseEntity.em().flush();
    }

    async hardDelete(where?: FilterQuery<T>, restoreFirst = true) {
        if (!where && this.hasOwnProperty('id')) {
            where = {
                // @ts-ignore
                id: this.id,
            };
        }
        if (!where) {
            throw new Error('Cannot hard delete without where clause or id');
        }
        const softDeletableMetadata = Reflect.getMetadata(
            SOFT_DELETABLE,
            this.constructor,
        );
        if (!softDeletableMetadata) {
            throw new Error(
                'Cannot hard delete entity that is not soft deletable',
            );
        }
        const deletedAtField = softDeletableMetadata.field ?? null;
        if (this[deletedAtField] !== null && restoreFirst) {
            await this.restore(where);
        }
        const entityName = getEntityName(this as unknown as Entity);
        await BaseEntity.em().nativeDelete(entityName, where, {
            filters: { [SOFT_DELETABLE_FILTER]: false },
        });
        await BaseEntity.em().flush();
    }

    getPrimaryKeyField(returnNullIfArray = false): null | string | string[] {
        return BaseEntity.getPrimaryKeyField(
            this.constructor.name,
            returnNullIfArray,
        );
    }

    getPrimaryKey() {
        const primaryKeyField = this.getPrimaryKeyField(true) as string | null;
        if (!primaryKeyField) {
            return null;
        }
        const primaryKeyValue = this[primaryKeyField];
        return primaryKeyValue;
    }

    getRouteKeyName() {
        const routeKeyName = Reflect.getMetadata(ROUTE_KEY, this.constructor);
        if (routeKeyName) {
            return routeKeyName;
        }
        return this.getPrimaryKeyField(true);
    }

    getRouteKey() {
        const routeKeyName = this.getRouteKeyName();
        if (routeKeyName) {
            return this[routeKeyName];
        }
        return null;
    }

    resolveRouteEntity(payload: number | string, findSoftDeleted = false) {
        const repository = BaseEntity.repository(this.constructor.name);
        const routeKeyName = this.getRouteKeyName();
        const options = findSoftDeleted
            ? { filters: { [SOFT_DELETABLE_FILTER]: false } }
            : {};
        if (
            !Reflect.getMetadata(ROUTE_KEY, this.constructor) &&
            this.hashedProperties().length > 0 &&
            typeof payload === 'string'
        ) {
            return repository.findOneByHashid(payload, options);
        }
        if (typeof payload === 'number') {
            return null;
        }

        return repository.findOne({ [routeKeyName]: payload } as any, options);
    }

    hashid() {
        const primaryKeyValue = this.getPrimaryKey();
        const hashids = BaseEntity.hashids(this.constructor.name);
        return hashids.encode(primaryKeyValue);
    }

    hashedProperties() {
        return Reflect.getMetadata(HASHIDS, this.constructor);
    }

    getHashidsConfig() {
        return BaseEntity.getHashidsConfig(this.constructor.name);
    }

    encodeToHashedId(value: number) {
        return BaseEntity.encodeToHashedId(value, this.constructor.name);
    }

    decodeHashedId(hashid: string) {
        return BaseEntity.decodeHashedId(hashid, this.constructor.name);
    }
}
