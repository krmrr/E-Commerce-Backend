import Hashids from 'hashids';
import { env } from '../../config/environment';
import { IHashidsConfig, IModifiedHashids } from './types';

export const HASHIDS = Symbol('hashids');

export const hashidsConfig = {
    default: {
        salt: env.HASHIDS_SALT ?? '',
        length: env.HASHIDS_LENGTH ?? 8,
        alphabet:
            env.HASHIDS_ALPHABET ??
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        seps: env.HASHIDS_SEPS ?? 'cfhistuCFHISTU',
    },
};

export class ModifiedHashids extends Hashids implements IModifiedHashids {
    decodeArray(id: string) {
        return super.decode(id);
    }

    //@ts-ignore
    decode(id: string) {
        return this.decodeArray(id)?.[0];
    }
}

export function createHashidsInstance(
    config?: IHashidsConfig,
): ModifiedHashids {
    if (!config) return hashids;

    const mergedConfig = { ...hashidsConfig.default, ...config };

    const hashidsInstance = new ModifiedHashids(
        mergedConfig.salt,
        mergedConfig.length,
        mergedConfig.alphabet,
        mergedConfig.seps,
    );

    return hashidsInstance;
}

export function hashidsSerializer(
    payload: any,
    config?: IHashidsConfig,
): string {
    if ([undefined, null].includes(payload)) return payload;
    const hashids = createHashidsInstance(config);
    let modifiedPayload = payload;

    if (typeof payload === 'number' && !Number.isNaN(payload)) {
        modifiedPayload = hashids.encode(payload);
    }

    return modifiedPayload;
}

export const hashids = createHashidsInstance(hashidsConfig.default);

export function isHashedId(text: string) {
    if (typeof text !== 'string') return false;
    const trimmedText = text.trim();
    return trimmedText.length >= (env.HASHIDS_LENGTH ?? 8);
}
