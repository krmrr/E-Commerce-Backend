import {
    ChangeSet,
    ChangeSetType,
    EventSubscriber,
    FlushEventArgs,
    RequestContext,
    Subscriber,
} from '@mikro-orm/core';
import { SOFT_DELETABLE } from 'mikro-orm-soft-delete';
import { BaseEntity } from '../../database/entities';
import { SortableEntity } from '../sorting';

@Subscriber()
export class SoftDeletesSubscriber implements EventSubscriber {
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
                    !!(entity as any).onSoftDelete
                ) {
                    (entity as any).onSoftDelete({
                        changeSet: changeSet,
                        entity,
                        em: RequestContext.getEntityManager(),
                    });
                }
            },
        );
    }
}
