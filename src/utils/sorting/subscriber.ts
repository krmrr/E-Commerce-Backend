import {
    ChangeSet,
    ChangeSetType,
    EventSubscriber,
    FlushEventArgs,
    Subscriber,
} from '@mikro-orm/core';
import { SOFT_DELETABLE } from 'mikro-orm-soft-delete';
import { BaseEntity } from '../../database/entities';
import { SortableEntity } from './index';

/**
 * Soft deletable entities are not triggering BeforeDelete and AfterDelete events,
 * so we use this subscriber to handle sorting related cases.
 * */
@Subscriber()
export class SortableHandlerSubscriber implements EventSubscriber {
    async onFlush({ uow }: FlushEventArgs): Promise<void> {
        const deletionChangeSets = uow
            .getChangeSets()
            .filter((changeSet) => changeSet.type == ChangeSetType.DELETE);
        deletionChangeSets.forEach(
            <Entity extends object, Field extends keyof Entity>(
                changeSet: ChangeSet<Entity>,
            ) => {
                const entity = changeSet.entity as unknown as
                    | BaseEntity<any, any>
                    | SortableEntity<any, any>;
                const metadataKeys = Reflect.getMetadataKeys(
                    entity.constructor,
                );

                if (
                    metadataKeys.includes(SOFT_DELETABLE) &&
                    entity instanceof SortableEntity
                ) {
                    entity.decrementNext();
                }
            },
        );
    }
}
