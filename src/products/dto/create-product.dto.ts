import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  categoryId: number;

  @IsString()
  description: string;

  @IsArray()
  imageUrl: [key: any];

  @IsOptional()
  @IsString()
  features?: string;

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsBoolean()
  saleStatu: boolean;

  @IsNumber()
  amount: number;
}
