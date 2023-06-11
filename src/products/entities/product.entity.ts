import {
  Cascade,
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  Property
} from "@mikro-orm/core";
import { BaseEntity } from "../../database/entities";
import { HashedId, hashidsSerializer } from "../../utils/hashids";
import { Category } from "../../categories/entities/category.entity";
import { SoftDeletable } from "mikro-orm-soft-delete";
import { Order } from "../../orders/entities/order.entity";
import { CurrencyType } from "../../enums";

@Entity({ tableName: "products" })
@SoftDeletable(() => Product, "deletedAt", () => new Date())
export class Product extends BaseEntity<Product, "id"> {
  @HashedId()
  id: number;

  @Property()
  name: string;

  @Property()
  slug: string;

  @Property()
  amount: number;

  @ManyToOne("Category", {
    joinColumn: "category_id",
    onDelete: "CASCADE",
    serializer: hashidsSerializer,
    columnType: "int"
  })
  category: Category;

  @Property({
    columnType: "text"
  })
  description: string;

  @Property({ type: "json", nullable: true })
  imageUrl: { [key: string]: any };

  @Property({ type: "json", nullable: true })
  features?: { [key: string]: any };

  @Property({
    columnType: "float"
  })
  price: number;

  @Enum({
    items: () => CurrencyType,
    type: () => CurrencyType
  })
  currency: CurrencyType;

  @Property({
    columnType: "boolean"
  })
  saleStatu: boolean;


  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;

  @OneToMany("Order", "product", {
    cascade: [Cascade.REMOVE],
    serializer: hashidsSerializer,
    hidden: true
  })
  order: Collection<Order> = new Collection<Order>(this);
}

