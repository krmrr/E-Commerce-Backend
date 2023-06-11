import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '../constants';
import { RolesGuard } from '../guards';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => {
    if (!Array.isArray(roles)) roles = [roles];

    return applyDecorators(
        UseGuards(RolesGuard),
        SetMetadata(ROLES_KEY, roles),
    );
};
