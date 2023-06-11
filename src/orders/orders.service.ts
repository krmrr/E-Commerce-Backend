import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { User } from "../users/entities";
import { Order } from "./entities/order.entity";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
  EntityRepository,
  FilterQuery
} from "@mikro-orm/core";
import { FindOptions } from "@mikro-orm/core/drivers/IDatabaseDriver";
import { isUndefined, omitBy } from "lodash";
import { PaymentService } from "../payment/payment.service";
import { env } from "../config/environment";
import { ProductsService } from "../products/products.service";

interface FindAllArgs {
  notStarted?: boolean;
  started?: boolean;
  order?: string;
  notEnded?: boolean;
  ended?: boolean;
}

interface FindOneArgs {
  id?: number;
  orderName?: string;
}

@Injectable()
export class OrdersService {

  constructor(
    @InjectRepository(Order)
    private orderRepository: EntityRepository<Order>,
    private paymentService: PaymentService,
    private productsService: ProductsService
  ) {
  }

  async create(createOrderDto: CreateOrderDto, user: User) {

    const urunAdet = createOrderDto.productIds.length;

    const products: any[] = [];

    for (let i = 0; i < urunAdet; i++) {

      const product = this.orderRepository.create({
        ...createOrderDto,
        user: user.id,
        product: createOrderDto.productIds[i],
        category: createOrderDto.categoryIds[i],
        orderName: createOrderDto.orderName,
        selectedFeatures: createOrderDto.selectedFeatures[i]
      });

      await this.orderRepository.persistAndFlush(product);


      const productCheck = await this.productsService.findOne({ id: createOrderDto.productIds[i] });

      products.push(productCheck);

    }


    const payment = await this.paymentService.sprite(createOrderDto.orderName, products);

    return payment;
  }

  findAll({ order }: FindAllArgs) {
    let where: FilterQuery<Order> = {};
    const options: FindOptions<Order, any> = {};


    if (order) {
      where = {
        orderName: {
          $like: "%" + order + "%"
        }
      };
    }


    return this.orderRepository.find(where, {
      populate: ["product", "category", "user"]
    });
  }

  findBasket(orderName: string) {
    let where: FilterQuery<Order> = {};
    const options: FindOptions<Order, any> = {};

    if (orderName) {
      where.orderName = orderName;
    }

    return this.orderRepository.find(where, options);

  }

  async findOne(
    { id, orderName }: FindOneArgs,
    throwNotFoundException: boolean = false
  ) {
    let where: FilterQuery<Order> = {};
    const options: FindOptions<Order, any> = {};

    if (id) {
      where.id = id;
    } else if (orderName) {
      where.orderName = orderName;
    } else {
      throw new BadRequestException(
        "One of id or order name must be provided"
      );
    }

    const order = await this.orderRepository.findOne(where, {
      populate: ["product", "category", "user"]
    });

    if (!order && throwNotFoundException) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne({ id }, true);

    this.orderRepository.assign(
      order,
      omitBy(
        updateOrderDto,
        isUndefined
      )
    );

    await this.orderRepository.flush();
    return order;
  }

  async succes(id: string) {
    const converterName = atob(atob(id));
    const orders = this.findBasket(converterName);


    (await orders).map((order) => {

      const updateOrderDto: UpdateOrderDto = Object.assign(
        new UpdateOrderDto(),
        {
          paymentStatus: "Succes",
          paymentCode: 1
        }
      );

      this.update(order.id, updateOrderDto);

    });

    return env.PAYMENTS_SUCCESS_URL;
  }

  async remove(id: number) {
    const order = await this.findOne({ id }, true);
    await this.orderRepository.removeAndFlush(order);
    return true;
  }
}
