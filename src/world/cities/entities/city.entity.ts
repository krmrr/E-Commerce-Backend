import {Cascade, Collection, Entity, ManyToOne, OneToMany, Property} from '@mikro-orm/core';
import { Country } from '../../countries/entities';
import { State } from '../../states/entities';
import { HashedId, hashidsSerializer } from '../../../utils/hashids';
import { BaseEntity } from '../../../database/entities';
import {Order} from "../../../orders/entities/order.entity";

@Entity({ tableName: 'cities', readonly: true })
export class City extends BaseEntity<City, 'id'> {
    @HashedId({ columnType: 'mediumint(8) unsigned' })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @ManyToOne({
        entity: 'State',
        index: 'cities_test_ibfk_1',
        serializer: hashidsSerializer,
    })
    state!: State;

    @Property({ length: 255 })
    stateCode!: string;

    @ManyToOne({
        entity: 'Country',
        index: 'cities_test_ibfk_2',
        serializer: hashidsSerializer,
    })
    country!: Country;

    @Property({ columnType: 'char(2)', length: 2 })
    countryCode!: string;

    @Property({ columnType: 'decimal(10,8)' })
    latitude!: string;

    @Property({ columnType: 'decimal(11,8)' })
    longitude!: string;

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

}
