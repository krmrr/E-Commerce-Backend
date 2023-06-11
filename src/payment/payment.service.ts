import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { env } from "../config/environment";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentService {

  async sprite(orderName?: string,products?: any[]) {




    const session = await new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2022-11-15"
    }).checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: products.map((item:any,index) => {
        return {
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name
            },
            unit_amount: +(item.price + "00")
          },
          quantity: 1
        };
      }),
      success_url: env.APP_URL + "/api/orders/load/" + btoa(btoa(orderName)),
      cancel_url: env.PAYMENTS_ERROR_URL
    });


    return { order: orderName, url: session.url };
  }
}
