import { forwardRef, Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Order } from "./entities/order.entity";
import { PaymentModule } from "../payment/payment.module";
import { ProductsModule } from "../products/products.module";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    MikroOrmModule.forFeature([Order]),
    forwardRef(() => PaymentModule),
    forwardRef(() => ProductsModule)
  ],
  exports: [OrdersService],
})
export class OrdersModule {
}
