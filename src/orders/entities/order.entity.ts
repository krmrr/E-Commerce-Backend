import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/core";
import { BaseEntity } from "../../database/entities";
import { HashedId, hashidsSerializer } from "../../utils/hashids";
import { Category } from "../../categories/entities/category.entity";
import { Product } from "../../products/entities/product.entity";
import { User } from "../../users/entities";
import { CurrencyType } from "../../enums";
import { SoftDeletable } from "mikro-orm-soft-delete";

@SoftDeletable(() => Order, "deletedAt", () => new Date())
@Entity({ tableName: "orders" })
export class Order extends BaseEntity<Order, "id"> {
  @HashedId()
  id: number;

  @Property()
  orderName?: string;

  @Property({ type: "json", nullable: true })
  selectedFeatures: { [key: string]: any };

  @ManyToOne("Product", {
    joinColumn: "product_id",
    onDelete: "CASCADE",
    serializer: hashidsSerializer,
    columnType: "int"
  })
  product: Product;

  @ManyToOne("User", {
    joinColumn: "user_id",
    onDelete: "CASCADE",
    serializer: hashidsSerializer,
    columnType: "int"
  })
  user: User;

  @ManyToOne("Category", {
    joinColumn: "category_id",
    onDelete: "CASCADE",
    serializer: hashidsSerializer,
    columnType: "int"
  })
  category: Category;

  @Property()
  amountPaid: number;

  @Enum({
    items: () => CurrencyType,
    type: () => CurrencyType
  })
  amountCurrency: CurrencyType;

  @Property()
  countryName: string;

  @Property()
  cityName: string;

  @Property()
  stateName: string;

  @Property()
  fullAddress: string;

  @Property()
  phoneNumber: string;

  @Property({
    nullable: true,
    default: "Unsuccessful"
  })
  paymentStatus: string;

  @Property({
    type: "json",
    nullable: true
  })
  paymentData: { [key: string]: any };

  @Property({ nullable: true })
  paymentCode: number;

  @Property({
    default: false
  })
  allComplated: boolean;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  cancelAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}
