import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '../../../users/entities';
import { HashedId } from '../../../utils/hashids';
import { RefreshToken } from './refresh-token.entity';
import { BaseEntity } from '../../../database/entities';

@Entity({ tableName: 'access_tokens' })
export class AccessToken extends BaseEntity<AccessToken, 'id'> {
    @HashedId()
    id: number;

    @ManyToOne('User', {
        onDelete: 'CASCADE',
        joinColumn: 'user_id',
        columnType: 'int',
    })
    user: User;

    @ManyToOne('RefreshToken', {
        nullable: true,
        onDelete: 'set null',
        joinColumn: 'refresh_token_id',
        columnType: 'int',
    })
    refreshToken?: RefreshToken;

    @Property({ name: 'is_revoked' })
    revoked: boolean = false;

    @Property()
    expiresAt: Date;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;
}
