import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import {IsBoolean, IsOptional, IsString} from "class-validator";

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsOptional()
    @IsString()
    readonly title?: string;

    @IsOptional()
    @IsString()
    readonly slug?: string;

    @IsOptional()
    @IsBoolean()
    readonly visibility?: boolean;
}
