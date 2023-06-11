import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductBodyDto {
    @IsString()
    name: string;

    @IsString()
    categoryId: string;

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
    amount:number;
}
