import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Role } from './role.entity';
import { User } from '../../../users/entities';
import { hashidsSerializer } from '../../../utils/hashids';
import { BaseEntity } from '../../../database/entities';

@Entity({ tableName: 'user_has_roles' })
export class UserHasRoles extends BaseEntity<UserHasRoles, undefined> {
    @ManyToOne({
        entity: 'User',
        primary: true,
        fieldName: 'user_id',
        referenceColumnName: 'id',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    user: User;

    @ManyToOne({
        entity: 'Role',
        primary: true,
        fieldName: 'role_id',
        referenceColumnName: 'id',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    role: Role;

    @Property({
        defaultRaw: 'CURRENT_TIMESTAMP',
    })
    createdAt: Date = new Date();
}
