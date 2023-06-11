import {Cascade, Collection, Entity, OneToMany, Property} from '@mikro-orm/core';
import { City } from 'src/world/cities/entities';
import { State } from '../../states/entities';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import { BaseEntity } from '../../../database/entities';
import {Order} from "../../../orders/entities/order.entity";

@Entity({ tableName: 'countries', readonly: true })
export class Country extends BaseEntity<Country, 'id'> {
    @HashedId({ columnType: 'mediumint(8) unsigned' })
    id!: number;

    @Property({ length: 100 })
    name!: string;

    @Property({
        columnType: 'char(3)',
        length: 3,
        nullable: true,
    })
    iso3?: string;

    @Property({
        columnType: 'char(3)',
        length: 3,
        nullable: true,
    })
    numericCode?: string;

    @Property({
        columnType: 'char(2)',
        length: 2,
        nullable: true,
    })
    iso2?: string;

    @Property({ length: 255, nullable: true, fieldName: 'phonecode' })
    phoneCode?: string;

    @Property({ length: 255, nullable: true })
    capital?: string;

    @Property({ length: 255, nullable: true })
    currency?: string;

    @Property({ length: 255, nullable: true })
    currencyName?: string;

    @Property({ length: 255, nullable: true })
    currencySymbol?: string;

    @Property({ length: 255, nullable: true })
    tld?: string;

    @Property({ length: 255, nullable: true })
    native?: string;

    @Property({ length: 255, nullable: true })
    region?: string;

    @Property({ length: 255, nullable: true })
    subregion?: string;

    @Property({
        columnType: 'text',
        length: 65535,
        nullable: true,
    })
    timezones?: string;

    @Property({
        columnType: 'text',
        length: 65535,
        nullable: true,
    })
    translations?: string;

    @Property({
        columnType: 'decimal(10,8)',
        precision: 10,
        scale: 8,
        nullable: true,
    })
    latitude?: number;

    @Property({
        columnType: 'decimal(11,8)',
        precision: 11,
        scale: 8,
        nullable: true,
    })
    longitude?: number;

    @Property({ length: 191, nullable: true })
    emoji?: string;

    @Property({
        fieldName: 'emojiU',
        length: 191,
        nullable: true,
    })
    emojiU?: string;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    @Property({ default: true })
    flag: boolean = true;

    @Property({
        fieldName: 'wikiDataId',
        length: 255,
        nullable: true,
    })
    wikiDataId?: string;

    @OneToMany('State', 'country', {
        serializer: hashidsSerializer,
        hidden: true,
    })
    states: Collection<State> = new Collection<State>(this);

    @OneToMany('City', 'country', {
        serializer: hashidsSerializer,
        hidden: true,
    })
    cities: Collection<City> = new Collection<City>(this);
}
