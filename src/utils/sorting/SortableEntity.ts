import { Entity, ExtractedEntity } from '../../config/mikro-orm.config';
import { BaseEntity } from '../../database/entities';
import {
    AfterDelete,
    BeforeCreate,
    EventArgs,
    FilterQuery,
} from '@mikro-orm/core';
import { Sorting } from './index';
import type { FindOptions } from '@mikro-orm/core/drivers';
import { QueryBuilder, SqlEntityManager } from '@mikro-orm/knex';

export abstract class SortableEntity<
    T extends InstanceType<Entity>,
    PK extends keyof T,
> extends BaseEntity<T, PK> {
    getSortableField() {
        return Sorting.getSortableField(this as ExtractedEntity<this>);
    }

    getSortableGroupFields() {
        return Sorting.getSortableGroupFields(
            this as unknown as Extract<Entity, T>,
        );
    }

    hasSortableField() {
        return Sorting.hasSortableField(this as ExtractedEntity<this>);
    }

    findLastOfOthersFilteredBySortableGroupFields(
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, string> = {},
    ) {
        return Sorting.findLastOfOthersFilteredBySortableGroupFields(
            this.em(),
            this as unknown as Entity,
            // @ts-ignore
            where,
            options,
        );
    }

    findLastOrderOfOthersFilteredBySortableGroupFields(
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, string> = {},
    ) {
        return Sorting.findLastOrderOfOthersFilteredBySortableGroupFields(
            this.em(),
            this as unknown as Entity,
            // @ts-ignore
            where,
            options,
        );
    }

    move(targetEntity: T, action: 'moveBefore' | 'moveAfter') {
        return Sorting.move(
            this.em(),
            this as unknown as Entity,
            targetEntity as unknown as Entity,
            action,
        );
    }

    moveBefore(targetEntity: T) {
        return Sorting.moveBefore(
            this.em(),
            this as unknown as Entity,
            targetEntity as unknown as Entity,
        );
    }

    moveAfter(targetEntity: T) {
        return Sorting.moveAfter(
            this.em(),
            this as unknown as Entity,
            targetEntity as unknown as Entity,
        );
    }

    previous(limit = 0, includeSelf = false, qb?: QueryBuilder) {
        return Sorting.previous(
            this.em(),
            this as unknown as Entity,
            limit,
            includeSelf,
            qb,
        );
    }

    next(limit = 0, includeSelf = false, qb?: QueryBuilder) {
        return Sorting.next(
            this.em(),
            this as unknown as Entity,
            limit,
            includeSelf,
            qb,
        );
    }

    siblings(
        isNext: boolean,
        limit = 0,
        includeSelf = false,
        qb?: QueryBuilder,
    ) {
        return Sorting.siblings(
            this.em(),
            this as unknown as Entity,
            isNext,
            limit,
            includeSelf,
            qb,
        );
    }

    getPrevious(limit = 0, includeSelf = false) {
        return Sorting.getPrevious(
            this.em(),
            this as unknown as Entity,
            limit,
            includeSelf,
        );
    }

    getNext(limit = 0, includeSelf = false) {
        return Sorting.getNext(
            this.em(),
            this as unknown as Entity,
            limit,
            includeSelf,
        );
    }

    async hardDelete(where?: FilterQuery<T>) {
        try {
            await this.restore(where);
        } catch (e) {
            // ignore
        }
        await super.hardDelete(where, false);
        await this.decrementNext();
    }

    async restore(where?: FilterQuery<T>) {
        await super.restore(where);
        await this.incrementNext(undefined, true);
        await this.decrementNext(1, true);
    }

    async incrementNext(limit = 0, includeSelf = false) {
        const field = this.getSortableField();
        const qb = (this.em() as SqlEntityManager).createQueryBuilder(
            this.constructor,
            '',
        );
        Sorting.queryIncrement(qb, field);
        this.next(limit, includeSelf, qb);
        await qb.execute('run');
    }

    async decrementNext(limit = 0, includeSelf = false) {
        const field = this.getSortableField();
        const qb = (this.em() as SqlEntityManager).createQueryBuilder(
            this.constructor,
            '',
        );
        Sorting.queryDecrement(qb, field);
        this.next(limit, includeSelf, qb);
        await qb.execute('run');
    }

    makeSortableGroupFieldsFilter() {
        return Sorting.makeSortableGroupFieldsFilter(
            this as unknown as Extract<Entity, T>,
        );
    }

    findOthersFilteredBySortableGroupFields(
        where: Partial<FilterQuery<T>> = {},
        options: FindOptions<T, string> = {},
    ) {
        return Sorting.findOthersFilteredBySortableGroupFields(
            this.em(),
            this as unknown as Entity,
            // @ts-ignore
            where,
            options,
        );
    }

    @BeforeCreate()
    async beforeCreate(args: EventArgs<any>): Promise<void> {
        const { entity, em } = args;
        const hasSortableField = Sorting.hasSortableField(entity);
        if (!hasSortableField) {
            return void 0;
        }

        const sortableField = Sorting.getSortableField(entity);
        const lastOrder =
            await Sorting.findLastOrderOfOthersFilteredBySortableGroupFields(
                em as SqlEntityManager,
                entity,
            );
        const newOrder = lastOrder + 1;

        if (
            entity[sortableField] === undefined ||
            entity[sortableField] == newOrder
        ) {
            entity[sortableField] = newOrder;
        } else if (entity[sortableField] === null) {
            entity[sortableField] = null;
        } else {
            throw new Error("You can't set sortable field manually");
        }
    }

    @AfterDelete()
    async afterDelete(args: EventArgs<any>): Promise<void> {
        // This won't work with soft delete, so we also use SortableHandlerSubscriber to cover this case
        const { entity } = args;
        await entity.decrementNext();
    }
}
