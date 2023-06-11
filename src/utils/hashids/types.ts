import { PrimaryKey } from '@mikro-orm/core';
import Hashids from 'hashids';
import { NumberLike } from 'hashids/esm/util';
import { Entity } from '../../config/mikro-orm.config';

export type IPrimaryKeyOptions = Parameters<typeof PrimaryKey>[0];

export interface IHashidsConfig {
    salt?: string;
    length?: number;
    alphabet?: string;
    seps?: string;
}

export type IModifiedHashids = Hashids & {
    decode: (id: string) => NumberLike;
    decodeArray: (id: string) => NumberLike[];
};

export interface IHashedId extends IPrimaryKeyOptions {
    primaryKey?: boolean;
    hashids?: IHashidsConfig;
}

export type IHashedRoutePayload =
    | string
    | {
          property: string;
          hashids?: IHashidsConfig;
          entity?: false | Entity;
      };
