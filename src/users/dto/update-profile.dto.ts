import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    readonly username?: string;

    @IsOptional()
    @IsString()
    readonly firstName?: string;

    @IsOptional()
    @IsString()
    readonly lastName?: string;
}
