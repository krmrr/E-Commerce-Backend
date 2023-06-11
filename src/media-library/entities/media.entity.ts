import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { HashedId, hashidsSerializer } from '../../utils/hashids';
import { User } from '../../users/entities';
import {
    SortableEntity,
    SortableField,
    SortableGroupField,
} from '../../utils/sorting';
import { SoftDeletable } from 'mikro-orm-soft-delete';

@SoftDeletable(() => Media, 'deletedAt', () => new Date())
@Entity({ tableName: 'media' })
export class Media extends SortableEntity<Media, 'id'> {
    @HashedId()
    id: number;

    @ManyToOne('User', {
        joinColumn: 'uploader_id',
        onDelete: 'CASCADE',
        serializer: hashidsSerializer,
        columnType: 'int',
        nullable: true,
    })
    uploader?: User;

    @SortableGroupField()
    @Property({ nullable: true })
    modelType?: string;

    @SortableGroupField()
    @HashedId({
        primaryKey: false,
        nullable: true,
    })
    modelId?: number;

    @SortableGroupField()
    @Property({ nullable: true })
    collectionName?: string;

    @Property({ nullable: true })
    name?: string;

    @Property({
        nullable: true,
        length: 2048,
    })
    description?: string;

    @Property()
    extension: string;

    @Property()
    fileName: string;

    @Property()
    directory: string;

    @Property()
    mimeType: string;

    @Property()
    disk: string;

    @Property({ nullable: true })
    conversionsDisk?: string;

    @Property({ unsigned: true })
    size: number;

    @Property({ type: 'json', nullable: true })
    manipulations?: [any] | { [key: string]: any };

    @Property({ type: 'json', nullable: true })
    generatedConversions?: { [key: string]: boolean };

    @Property({ type: 'json', nullable: true })
    responsiveImages?: { [key: string]: string };

    @SortableField()
    @Property({
        unsigned: true,
        nullable: true,
    })
    order?: number;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    @Property({ nullable: true })
    deletedAt?: Date;
}
