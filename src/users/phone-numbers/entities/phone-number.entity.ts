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
import { User } from '../../entities';
import { Country } from '../../../world/countries/entities';
import { CountryCode, Genre, Proximity, PhoneNumberType } from '../constants';
import {
    SortableEntity,
    SortableField,
    SortableGroupField,
} from '../../../utils/sorting';
import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { SoftDeletable } from 'mikro-orm-soft-delete';

@SoftDeletable(() => PhoneNumber, 'deletedAt', () => new Date())
@Entity({ tableName: 'phone_numbers' })
export class PhoneNumber extends SortableEntity<PhoneNumber, 'id'> {
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

    @ManyToOne('Country', {
        joinColumn: 'country_id',
        onDelete: 'CASCADE',
        serializer: hashidsSerializer,
        columnType: 'mediumint(8)',
    })
    country: Country;

    @Property()
    contactName: string;

    @Property({ length: 15 })
    e164Format: string;

    @Property({ length: 32 })
    nationalFormat: string;

    @Property({ length: 32 })
    internationalFormat: string;

    @Enum({
        items: () => PhoneNumberType,
        type: () => PhoneNumberType,
    })
    type: PhoneNumberType;

    @Enum({
        items: () => Genre,
        type: () => Genre,
    })
    genre: Genre;

    @SortableGroupField()
    @Enum({
        items: () => Proximity,
        type: () => Proximity,
        default: Proximity.Self,
    })
    proximity: Proximity;

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

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    @Property({ nullable: true })
    deletedAt?: Date;

    get object() {
        return parsePhoneNumberFromString(
            this.e164Format,
            this.country.iso2 as CountryCode,
        ) as unknown as PhoneNumber;
    }

    private static deleteHandler(args: EventArgs<PhoneNumber>) {
        const { entity } = args;
        if (
            entity.type === PhoneNumberType.Primary &&
            entity.proximity === Proximity.Self
        ) {
            throw new BadRequestException(
                'Primary numbers cannot be removed. Set another number as a primary number first',
            );
        }
    }

    @AfterCreate()
    async afterCreate(args: EventArgs<PhoneNumber>): Promise<void> {
        const { entity } = args;
        await this.ensureSinglePrimaryType(entity);
    }

    @AfterUpdate()
    async afterUpdate(args: EventArgs<PhoneNumber>): Promise<void> {
        const { entity } = args;
        await this.ensureSinglePrimaryType(entity);
    }

    @BeforeDelete()
    beforeDelete(args: EventArgs<PhoneNumber>) {
        return PhoneNumber.deleteHandler(args);
    }

    onSoftDelete(args: EventArgs<PhoneNumber>) {
        return PhoneNumber.deleteHandler(args);
    }

    /**
     * Only one primary typed phone number is allowed per person and this function ensures it.
     *
     * We should update types after insert/update query, so we won't update types if insert/update fails somehow
     *
     * @param phoneNumber
     * @private
     */
    private async ensureSinglePrimaryType(phoneNumber: PhoneNumber) {
        if (phoneNumber.type === PhoneNumberType.Primary) {
            const user = phoneNumber.user;
            await this.repository().nativeUpdate(
                {
                    user,
                    type: PhoneNumberType.Primary,
                    $ne: phoneNumber,
                },
                {
                    type: PhoneNumberType.Secondary,
                },
            );
        }
    }
}
