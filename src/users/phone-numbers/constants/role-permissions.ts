import { Role } from '../../../auth/authorization/constants';
import { PhoneNumberPermission } from './permission.enum';

export const phoneNumberRolePermissions = {
    [Role.Admin]: [PhoneNumberPermission.ListOthersPhoneNumbers],
};
