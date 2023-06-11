import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imageUrl: string;


  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsBoolean()
  saleStatu: boolean;

  @IsOptional()
  @IsNumber()
  amount: number;
}
