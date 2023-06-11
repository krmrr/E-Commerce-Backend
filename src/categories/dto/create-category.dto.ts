import {IsBoolean, IsString} from "class-validator";

export class CreateCategoryDto {
    @IsString()
    readonly title: string;

    @IsBoolean()
    readonly visibility: boolean;
}
