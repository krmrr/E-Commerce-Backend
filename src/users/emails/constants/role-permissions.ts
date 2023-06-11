import { Role } from '../../../auth/authorization/constants';
import { EmailPermission } from './permission.enum';

export const emailRolePermissions = {
    [Role.Admin]: [EmailPermission.ListOthersEmails],
};
