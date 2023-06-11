import { IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
    @IsOptional()
    @IsString()
    readonly name?: string;

    @IsOptional()
    @IsString()
    readonly title?: string;

    @IsOptional()
    @IsString()
    readonly description?: string;
}
