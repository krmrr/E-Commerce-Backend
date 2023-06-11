import { CurrencyType } from "../../enums";
import { IsArray, IsBoolean, IsDate, IsEnum, IsJSON, IsNumber, IsString } from "class-validator";

export class CreateOrderBodyDto {
  @IsArray()
  productIds: [key: string];

  @IsArray()
  selectedFeatures: [key: string];

  @IsArray()
  categoryIds: [key: string];

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
