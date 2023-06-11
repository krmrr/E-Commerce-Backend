import {Cascade, Collection, Entity, OneToMany, Property} from '@mikro-orm/core';
import {HashedId, hashidsSerializer} from '../../utils/hashids';
import { BaseEntity } from '../../database/entities';
import {Product} from "../../products/entities/product.entity";
import {Order} from "../../orders/entities/order.entity";

@Entity({ tableName: 'categories' })
export class Category extends BaseEntity<Category, 'id'> {
    @HashedId()
    id: number;

    @Property({
        length: 256,
    })
    title: string;

    @Property({
        length: 450
    })
    slug: string;

    @Property({
        columnType:"boolean"
    })
    visibility: boolean;

    @Property()
    createdAt: Date = new Date();

    @OneToMany('Product', 'category', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    product: Collection<Product> = new Collection<Product>(this);

    @OneToMany('Order', 'category', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    order: Collection<Order> = new Collection<Order>(this);

}
