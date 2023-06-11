import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '../../../users/entities';
import { Permission } from './permission.entity';
import { hashidsSerializer } from '../../../utils/hashids';
import { BaseEntity } from '../../../database/entities';

@Entity({ tableName: 'user_has_permissions' })
export class UserHasPermissions extends BaseEntity<
    UserHasPermissions,
    undefined
> {
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
        entity: 'Permission',
        primary: true,
        fieldName: 'permission_id',
        referenceColumnName: 'id',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    permission: Permission;

    @Property({
        defaultRaw: 'CURRENT_TIMESTAMP',
    })
    createdAt: Date = new Date();
}
