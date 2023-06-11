import {
    Cascade,
    Collection,
    Entity,
    ManyToOne,
    OneToMany,
    Property,
} from '@mikro-orm/core';
import { Country } from '../../countries/entities';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import { City } from '../../cities/entities';
import { BaseEntity } from '../../../database/entities';
import {Order} from "../../../orders/entities/order.entity";

@Entity({ tableName: 'states', readonly: true })
export class State extends BaseEntity<State, 'id'> {
    @HashedId({ columnType: 'mediumint(8) unsigned' })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @ManyToOne({
        entity: 'Country',
        index: 'country_region',
        serializer: hashidsSerializer,
    })
    country!: Country;

    @Property({ columnType: 'char(2)', length: 2 })
    countryCode!: string;

    @Property({ length: 255, nullable: true })
    fipsCode?: string;

    @Property({ length: 255, nullable: true })
    iso2?: string;

    @Property({ length: 191, nullable: true })
    type?: string;

    @Property({
        columnType: 'decimal(10,8)',
        precision: 10,
        scale: 8,
        nullable: true,
    })
    latitude?: string;

    @Property({
        columnType: 'decimal(11,8)',
        precision: 11,
        scale: 8,
        nullable: true,
    })
    longitude?: string;

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

    @OneToMany('City', 'state', {
        serializer: hashidsSerializer,
        hidden: true,
    })
    cities: Collection<City> = new Collection<City>(this);

}
