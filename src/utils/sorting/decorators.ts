import { Entity } from '../../config/mikro-orm.config';

export const SORTABLE_FIELD = Symbol('sortable-field');
export const SORTABLE_GROUP_FIELDS = Symbol('sortable-group-fields');

export const SortableField =
    () =>
    <
        T extends InstanceType<Entity> & Partial<Record<K, number>>,
        K extends string,
    >(
        target: T,
        propertyName: K,
    ) => {
        // ... impl here
        const entity = target;
        const sortableField = Reflect.getMetadata(SORTABLE_FIELD, entity);
        if (sortableField) {
            throw new Error(
                'Only one @SortableField decorator can be used on an entity class',
            );
        }
        Reflect.defineMetadata(SORTABLE_FIELD, propertyName, entity);
    };

export const SortableGroupField =
    () =>
    <
        T extends InstanceType<Entity> & Partial<Record<K, any>>,
        K extends string,
    >(
        target: T,
        propertyName: K,
    ) => {
        const entity = target;
        const sortableGroupFields: string[] =
            Reflect.getMetadata(SORTABLE_GROUP_FIELDS, entity) ?? [];
        if (!sortableGroupFields.includes(propertyName)) {
            sortableGroupFields.push(propertyName);
        }
        Reflect.defineMetadata(
            SORTABLE_GROUP_FIELDS,
            sortableGroupFields,
            entity,
        );
    };
