import {
    Cascade,
    Collection,
    Entity,
    ManyToOne,
    OneToMany,
    Property,
} from '@mikro-orm/core';
import { User } from '../../../users/entities';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import { AccessToken } from './access-token.entity';
import { BaseEntity } from '../../../database/entities';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken extends BaseEntity<RefreshToken, 'id'> {
    @HashedId()
    id: number;

    @ManyToOne('User', {
        onDelete: 'CASCADE',
        joinColumn: 'user_id',
        columnType: 'int unsigned',
    })
    user: User;

    @Property({ name: 'is_revoked' })
    revoked: boolean = false;

    @Property({ name: 'consumes_count' })
    consumes: number = 0;

    @OneToMany('AccessToken', 'refreshToken', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
    })
    accessTokens: Collection<AccessToken> = new Collection<AccessToken>(this);

    @Property()
    expiresAt: Date;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;
}
