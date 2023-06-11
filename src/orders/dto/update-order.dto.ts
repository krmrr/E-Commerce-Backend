import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CurrencyType } from "../../enums";

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  amountPaid: number;

  @IsOptional()
  @IsEnum(CurrencyType)
  amountCurrency: CurrencyType;

  @IsOptional()
  @IsString()
  countryName: string;

  @IsOptional()
  @IsBoolean()
  allComplated: boolean;

  @IsOptional()
  @IsString()
  cityName: string;

  @IsOptional()
  @IsNumber()
  paymentCode:number;

  @IsOptional()
  @IsString()
  paymentStatus:string;

  @IsOptional()
  @IsString()
  stateName: string;

  @IsOptional()
  @IsString()
  fullAddress: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;
}
