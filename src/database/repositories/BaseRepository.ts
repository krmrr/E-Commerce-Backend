import { SqlEntityRepository } from '@mikro-orm/knex';
import { entities, Entity } from '../../config/mikro-orm.config';
import { FindOneOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';

export class BaseRepository<
    T extends InstanceType<Entity>,
> extends SqlEntityRepository<T> {
    public findOneByHashid<P extends string = never>(
        hashedId: string,
        options?: FindOneOptions<T, P>,
    ) {
        if (!hashedId) return null;
        const entityType = this.entityName;
        const entity = entities[entityType as string] as Entity;
        const decoded = entity.prototype.hashids().decode(hashedId) as number;
        if (!decoded) return null;
        const primaryKey = entity.prototype.getPrimaryKeyField(true) as string;
        if (!primaryKey) return null;
        return this.findOne({ [primaryKey]: decoded } as any, options);
    }
}
