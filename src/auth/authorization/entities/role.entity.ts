import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import { User } from '../../../users/entities';
import { UserHasRoles } from './user-has-roles.entity';
import { BaseEntity } from '../../../database/entities';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity<Role, 'id'> {
    @HashedId()
    id: number;

    @Property({ unique: true })
    name: string;

    @Property({ nullable: true })
    title?: string;

    @Property({
        nullable: true,
    })
    description?: string;

    @ManyToMany({
        entity: 'User',
        pivotEntity: 'UserHasRoles',
        serializer: hashidsSerializer,
    })
    users: Collection<User>;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;
}
