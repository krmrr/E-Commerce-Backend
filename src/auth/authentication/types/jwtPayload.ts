import { User } from '../../../users/entities';
import { RefreshToken } from '../entities';

export type JwtInsertPayload = {
    user: Pick<User, 'id'>;
    expiresAt: Date;
    refreshToken?: RefreshToken;
};

export type JwtSignPayload = {
    sub: string;
    jwtId: string;
    consumes?: number;
};
