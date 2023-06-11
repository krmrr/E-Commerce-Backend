import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Auth } from "../auth/authentication/decorators";

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Auth()
  @Post()
  create() {
    return this.paymentService.sprite();
  }


}
