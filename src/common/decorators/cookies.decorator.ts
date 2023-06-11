import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request: Request = ctx.switchToHttp().getRequest();
        return data
            ? (request as any).cookies?.[data]
            : (request as any).cookies;
    },
);
