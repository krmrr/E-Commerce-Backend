import { Exclude, Expose } from 'class-transformer';
import { pickBy } from 'lodash';
import { User } from '../entities';
import { hashids } from '../../utils/hashids';
import { IsString } from 'class-validator';

@Exclude()
export class UserDto {
    @Expose()
    @IsString()
    readonly id: string;

    @Expose()
    @IsString()
    readonly username: string;

    @Expose()
    @IsString()
    readonly firstName: string;

    @Expose()
    @IsString()
    readonly lastName: string;

    constructor(
        partial: Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>,
    ) {
        const filteredPartial = pickBy(partial, (value, key) =>
            ['id', 'username', 'firstName', 'lastName'].includes(key),
        );
        filteredPartial.id = User.hashids().encode(partial.id);

        Object.assign(this, filteredPartial);
    }
}
