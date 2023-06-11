import { IsArray, IsBoolean, IsEnum, IsJSON, IsNumber, IsString } from "class-validator";
import { CurrencyType } from "../../enums";

export class CreateOrderDto {
  @IsArray()
  productIds: [key: number];

  @IsArray()
  selectedFeatures: [key: any];

  @IsArray()
  categoryIds: [key: number];

  @IsString()
  orderName:string;

  @IsNumber()
  amountPaid: number;

  @IsEnum(CurrencyType)
  amountCurrency: CurrencyType;

  @IsString()
  countryName: string;

  @IsString()
  cityName: string;

  @IsString()
  stateName: string;

  @IsString()
  fullAddress: string;

  @IsString()
  phoneNumber: string;
}
