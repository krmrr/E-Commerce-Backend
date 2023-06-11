import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '../../users/entities';
import { HashedId, hashidsSerializer } from '../../utils/hashids';
import { BaseEntity } from '../../database/entities';

@Entity({ tableName: 'posts' })
export class Post extends BaseEntity<Post, 'id'> {
    @HashedId()
    id: number;

    @Property()
    title: string;

    @Property()
    body: string;

    @ManyToOne('User', {
        joinColumn: 'author_id',
        onDelete: 'CASCADE',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    author: User;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;
}
