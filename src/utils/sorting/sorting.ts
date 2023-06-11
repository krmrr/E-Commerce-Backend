import { SORTABLE_FIELD, SORTABLE_GROUP_FIELDS } from './decorators';
import { Entity, getEntityName } from '../../config/mikro-orm.config';
import { EntityManager, QueryBuilder } from '@mikro-orm/knex';
import { FilterQuery, wrap } from '@mikro-orm/core';
import type { FindOptions } from '@mikro-orm/core/drivers';
import { isEqual } from 'lodash';

export class Sorting {
    static moveAfter(
        em: EntityManager,
        movingEntity: Entity,
        targetEntity: Entity,
    ) {
        return Sorting.move(em, movingEntity, targetEntity, 'moveAfter');
    }

    static moveBefore(
        em: EntityManager,
        movingEntity: Entity,
        targetEntity: Entity,
    ) {
        return Sorting.move(em, movingEntity, targetEntity, 'moveBefore');
    }

    static checkSortableGroupFields(
        movingEntity: Entity,
        targetEntity: Entity,
    ) {
        if (movingEntity.constructor !== targetEntity.constructor) {
            throw new Error(
                'Moving entity and target entity must be of the same type',
            );
        }

        const movingEntitySortableGroupFieldValues =
            Sorting.getSortableGroupFieldValues(movingEntity);
        const targetEntitySortableGroupFieldValues =
            Sorting.getSortableGroupFieldValues(targetEntity);
        if (
            !isEqual(
                movingEntitySortableGroupFieldValues,
                targetEntitySortableGroupFieldValues,
            )
        ) {
            throw new Error(
                'Moving entity and target entity must use same sortable group field values',
            );
        }
    }

    static async move(
        em: EntityManager,
        movingEntity: Entity,
        targetEntity: Entity,
        action: 'moveBefore' | 'moveAfter',
    ) {
        Sorting.checkSortableGroupFields(movingEntity, targetEntity);

        const sortableField = Sorting.getSortableField(movingEntity);
        const oldPosition = movingEntity[sortableField] as number;
        const newPosition = targetEntity[sortableField] as number;

        if (oldPosition === newPosition) {
            return;
        }

        const isMoveBefore = action === 'moveBefore'; // otherwise moveAfter
        const isMoveForward = oldPosition < newPosition;
        const qb = Sorting.createQueryBuilder(em, movingEntity);

        if (isMoveForward) {
            Sorting.queryDecrement(qb, sortableField);
            Sorting.queryBetween(qb, movingEntity, oldPosition, newPosition);
        } else {
            Sorting.queryIncrement(qb, sortableField);
            Sorting.queryBetween(qb, movingEntity, newPosition, oldPosition);
        }
        await qb.execute('run');

        const movingEntityNewPosition = Sorting.getNewPosition(
            isMoveBefore,
            isMoveForward,
            newPosition,
        );
        wrap(movingEntity).assign({
            [sortableField]: movingEntityNewPosition,
        });
        const targetEntityNewPosition = Sorting.getNewPosition(
            !isMoveBefore,
            isMoveForward,
            newPosition,
        );
        wrap(targetEntity).assign({
            [sortableField]: targetEntityNewPosition,
        });
        await em.persistAndFlush([movingEntity, targetEntity]);
    }

    static getNewPosition(
        isMoveBefore: boolean,
        isMoveForward: boolean,
        position: number,
    ) {
        if (!isMoveBefore) {
            ++position;
        }
        if (isMoveForward) {
            --position;
        }
        return position;
    }

    static queryBetween<T extends Entity>(
        qb: QueryBuilder,
        entity: T,
        left: number,
        right: number,
    ) {
        const sortableField = Sorting.getSortableField(entity);
        Sorting.applySortableGroups(qb, entity);
        qb.andWhere({
            [sortableField]: { $gt: left, $lt: right },
        });
        return qb;
    }

    static previous(
        em: EntityManager,
        entity: Entity,
        limit = 0,
        includeSelf = false,
        qb?: QueryBuilder,
    ) {
        return Sorting.siblings(em, entity, false, limit, includeSelf, qb);
    }

    static next(
        em: EntityManager,
        entity: Entity,
        limit = 0,
        includeSelf = false,
        qb?: QueryBuilder,
    ) {
        return Sorting.siblings(em, entity, true, limit, includeSelf, qb);
    }

    static siblings(
        em: EntityManager,
        entity: Entity,
        isNext: boolean,
        limit = 0,
        includeSelf = false,
        qb?: QueryBuilder,
    ) {
        const includeSelfAdditionalString = includeSelf ? 'e' : '';
        const sortableField = Sorting.getSortableField(entity);

        if (!qb) {
            qb = Sorting.createQueryBuilder(em, entity);
        }
        Sorting.applySortableGroups(qb, entity);

        const wherePayload = isNext
            ? '$gt' + includeSelfAdditionalString
            : '$lt' + includeSelfAdditionalString;
        qb.andWhere({
            [sortableField]: { [wherePayload]: entity[sortableField] },
        });
        qb.orderBy({
            [sortableField]: isNext ? 'ASC' : 'DESC',
        });
        if (limit != 0) {
            qb.limit(limit);
        }

        return qb;
    }

    static async getPrevious(
        em: EntityManager,
        entity: Entity,
        limit = 0,
        includeSelf = false,
    ) {
        const queryResult = await Sorting.previous(
            em,
            entity,
            limit,
            includeSelf,
        ).execute('all');

        return queryResult.reverse();
    }

    static getNext(
        em: EntityManager,
        entity: Entity,
        limit = 0,
        includeSelf = false,
    ) {
        return Sorting.next(em, entity, limit, includeSelf).execute('all');
    }

    static makeSortableGroupFieldsFilter<T extends Entity>(entity: T) {
        const sortableGroupFields = Sorting.getSortableGroupFields(entity);
        const where = {} as any;
        sortableGroupFields.map((field) => {
            where[field] = entity[field];
        });
        return where as Partial<FilterQuery<T>>;
    }

    static applySortableGroups(qb: QueryBuilder, entity: Entity) {
        const sortableGroupFields = Sorting.getSortableGroupFields(entity);
        sortableGroupFields
            .map((field) => {
                qb.andWhere({ [field]: entity[field] });
            })
            .join('and');
        return qb;
    }

    static getSortableGroupFields<T extends Entity>(entity: T): (keyof T)[] {
        const sortableGroupFields =
            Reflect.getMetadata(SORTABLE_GROUP_FIELDS, entity) ?? [];
        return sortableGroupFields;
    }

    static getSortableField<T extends Entity>(entity: T): string {
        const sortableField = Reflect.getMetadata(SORTABLE_FIELD, entity);
        if (!sortableField) {
            throw new Error("Entity doesn't have any sortable field");
        }
        return sortableField;
    }

    static hasSortableField(entity: Entity): boolean {
        return Reflect.hasMetadata(SORTABLE_FIELD, entity);
    }

    static getSortableGroupFieldValues<T extends Entity>(entity: T) {
        const sortableGroupFields = Sorting.getSortableGroupFields(entity);
        const values = {} as any;
        sortableGroupFields.map((field) => {
            values[field] = entity[field];
        });
        return values;
    }

    static async findOthersFilteredBySortableGroupFields<
        T extends Entity,
        P extends string = never,
    >(
        em: EntityManager,
        entity: T,
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, P> = {},
    ) {
        const sortableGroupFieldsWhere =
            Sorting.makeSortableGroupFieldsFilter(entity);
        const finalWhere = {
            ...sortableGroupFieldsWhere,
            ...where,
        } as FilterQuery<T>;
        const lastOrderEntity = (await em.find(
            entity.constructor,
            finalWhere,
            options,
        )) as unknown as T;

        return lastOrderEntity;
    }

    static async findLastOfOthersFilteredBySortableGroupFields<
        T extends Entity,
        P extends string = never,
    >(
        em: EntityManager,
        entity: T,
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, P> = {},
    ) {
        const sortableField = Sorting.getSortableField(entity);
        const finalOptions = {
            orderBy: { [sortableField]: 'DESC' },
            limit: 1,
            ...options,
        };
        const others = await Sorting.findOthersFilteredBySortableGroupFields(
            em,
            entity,
            where,
            finalOptions as FindOptions<T, P>,
        );
        const lastEntity = others?.[0];

        return lastEntity;
    }

    static async findLastOrderOfOthersFilteredBySortableGroupFields<
        T extends Entity,
        P extends string = never,
    >(
        em: EntityManager,
        entity: Entity,
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, P> = {},
    ) {
        const sortableField = Sorting.getSortableField(entity);
        const finalOptions = {
            fields: [sortableField],
            ...options,
        };
        const lastEntity =
            await Sorting.findLastOfOthersFilteredBySortableGroupFields(
                em,
                entity,
                where,
                finalOptions as any,
            );

        return lastEntity?.[sortableField] ?? 0;
    }

    static createQueryBuilder(em: EntityManager, entity: Entity) {
        const entityName = getEntityName(entity);
        return em.createQueryBuilder(entityName);
    }

    static queryIncrement(qb: QueryBuilder, field: string) {
        qb.update({ [field]: qb.raw('`' + field + '` + 1') });
        return qb;
    }

    static queryDecrement(qb: QueryBuilder, field: string) {
        qb.update({ [field]: qb.raw('`' + field + '` - 1') });
        return qb;
    }
}
