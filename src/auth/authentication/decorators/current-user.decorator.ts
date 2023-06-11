import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../users/entities';

export const CurrentUser = createParamDecorator(
    (
        data: keyof User | 'accessToken' | 'refreshToken' | undefined,
        ctx: ExecutionContext,
    ) => {
        const request: Request = ctx.switchToHttp().getRequest();
        const auth = (request as any).auth;
        const user = auth.user as User;

        if (!data) return user;
        if (['accessToken', 'refreshToken'].includes(data)) {
            return auth[data];
        }
        return user[data];
    },
);
