import { IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  readonly basket: string;
}
