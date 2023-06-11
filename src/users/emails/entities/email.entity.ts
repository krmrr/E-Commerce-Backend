import {
    AfterCreate,
    AfterUpdate,
    BeforeDelete,
    Entity,
    Enum,
    EventArgs,
    ManyToOne,
    Property,
} from '@mikro-orm/core';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import {
    SortableEntity,
    SortableField,
    SortableGroupField,
} from '../../../utils/sorting';
import { EmailType } from '../constants';
import { User } from '../../entities';
import { SoftDeletable } from 'mikro-orm-soft-delete';
import { BadRequestException } from '@nestjs/common';

@SoftDeletable(() => Email, 'deletedAt', () => new Date())
@Entity({ tableName: 'emails' })
export class Email extends SortableEntity<Email, 'id'> {
    @HashedId()
    id: number;

    @SortableGroupField()
    @ManyToOne('User', {
        joinColumn: 'user_id',
        onDelete: 'CASCADE',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    user: User;

    @Property()
    address: string;

    @Enum({
        items: () => EmailType,
        type: () => EmailType,
    })
    type: EmailType;

    @Property({
        length: 1024,
        nullable: true,
    })
    details?: string;

    @SortableField()
    @Property({
        unsigned: true,
        nullable: true,
    })
    order?: number;

    @Property({ nullable: true })
    confirmedAt?: Date;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    @Property({ nullable: true })
    deletedAt?: Date;

    @AfterCreate()
    async afterCreate(args: EventArgs<Email>): Promise<void> {
        const { entity } = args;
        await this.ensureSinglePrimaryType(entity);
    }

    @AfterUpdate()
    async afterUpdate(args: EventArgs<Email>): Promise<void> {
        const { entity } = args;
        await this.ensureSinglePrimaryType(entity);
    }

    @BeforeDelete()
    beforeDelete(args: EventArgs<Email>) {
        return this.deleteHandler(args);
    }

    onSoftDelete(args: EventArgs<Email>) {
        return this.deleteHandler(args);
    }

    deleteHandler(args: EventArgs<Email>) {
        const { entity } = args;
        if (entity.type === EmailType.Primary) {
            throw new BadRequestException(
                'Primary emails cannot be removed. Set another email as a primary email first',
            );
        }
    }

    /**
     * Only one primary typed email is allowed per person and this function ensures it.
     *
     * We should update types after insert/update query, so we won't update types if insert/update fails somehow
     *
     * @param email
     * @private
     */
    private async ensureSinglePrimaryType(email: Email) {
        if (email.type === EmailType.Primary) {
            const user = email.user;
            await this.repository().nativeUpdate(
                {
                    user,
                    type: EmailType.Primary,
                    $ne: email,
                },
                {
                    type: EmailType.Secondary,
                },
            );
        }
    }
}
