import {
  Body,
  Controller,
  Delete,
  Get, Param,
  Patch,
  Post,
  Query, Res
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateOrderBodyDto } from "./dto/create-order.body.dto";
import { Category } from "../categories/entities/category.entity";
import { Auth, CurrentUser } from "../auth/authentication/decorators";

import { Product } from "../products/entities/product.entity";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Order } from "./entities/order.entity";
import { User } from "../users/entities";
import { HashedRouteParam } from "../utils/hashids";
import { Permissions } from "../auth/authorization/decorators";

@Controller("api/orders")
export class OrdersController {
  static entity = Order;

  constructor(private readonly ordersService: OrdersService) {
  }

  @Auth()
  @Post()
  create(
    @CurrentUser() user: User,
    @Body() createOrderBodyDto: CreateOrderBodyDto
  ) {


    const productIds = [];
    const categoryIds = [];
    const orderName = "#OR" + "-" + Math.floor(Math.random() * 100000000000000000).toString();

    createOrderBodyDto.productIds.map((id) => productIds.push(Product.decodeHashedId(id)));

    createOrderBodyDto.categoryIds.map((id) => categoryIds.push(Category.decodeHashedId(id)));


    const createOrderDto: CreateOrderDto = Object.assign(
      new CreateOrderDto(),
      {
        ...createOrderBodyDto,
        categoryIds,
        productIds,
        orderName
      }
    );
    return this.ordersService.create(createOrderDto, user);
  }

  @Permissions()
  @Auth()
  @Get()
  findAll(
    @Query("notStarted") notStarted?: boolean,
    @Query("started") started?: boolean,
    @Query("notEnded") notEnded?: boolean,
    @Query("ended") ended?: boolean,
    @Query("order") order?: string
  ) {
    return this.ordersService.findAll({
      notStarted,
      started,
      order,
      notEnded,
      ended
    });
  }

  @Permissions()
  @Auth()
  @Get(":id")
  findOne(@HashedRouteParam("id") id: number) {
    return this.ordersService.findOne({ id });
  }

  @Get("load/:id")
  async load(
    @Param("id") key:string,
    @Res() res
       ){
    const services = await this.ordersService.succes(key);

    res.redirect(services)
  }

  @Permissions()
  @Auth()
  @Patch(":id")
  update(
    @HashedRouteParam("id") id: number,
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return this.ordersService.update(Number(id), updateOrderDto);
  }

  @Permissions()
  @Auth()
  @Delete(":id")
  remove(@HashedRouteParam("id") id: number) {
    return this.ordersService.remove(id);
  }
}
