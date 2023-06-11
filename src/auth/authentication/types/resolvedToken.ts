import { User } from '../../../users/entities';
import { AccessToken, RefreshToken } from '../entities';
import { JwtSignPayload } from './jwtPayload';

export interface ResolvedToken {
    user: User;
    token: AccessToken | RefreshToken;
    encoded: string;
    decoded: JwtSignPayload;
}
