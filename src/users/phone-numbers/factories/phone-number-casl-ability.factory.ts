import { Action, Role } from '../../../auth/authorization/constants';
import { User } from '../../entities';
import { AbilityBuilderInstance } from '../../../auth/authorization/types';
import { Request } from 'express';
import { BaseCaslAbilityFactory } from '../../../auth/authorization/factories/base-casl-ability-factory';
import { PhoneNumber } from '../entities';
import { PhoneNumberPermission } from '../constants';

export class PhoneNumberCaslAbilityFactory extends BaseCaslAbilityFactory {
    static async setAbilities(
        { can, cannot }: AbilityBuilderInstance,
        user: User,
        request: Request,
        entity?: PhoneNumber,
    ): Promise<void> {
        const isAdmin = await user.hasRole(Role.Admin);

        if (isAdmin) {
            can(Action.Manage, PhoneNumber);
        }

        const userIdHeader = request.query['userId'] as string | undefined;
        const isListingOthersPhoneNumber =
            userIdHeader && userIdHeader !== user.hashid();

        if (
            !isListingOthersPhoneNumber ||
            (await user.hasPermission(
                PhoneNumberPermission.ListOthersPhoneNumbers,
            ))
        ) {
            can(Action.Index, PhoneNumber);
        }

        can(Action.Create, PhoneNumber);

        /** We also allow read, update and delete if entity is undefined. If we don't do this, we will get "403 Forbidden"
         * instead of "404 Not Found".
         */
        if (!entity || (entity && entity.user.id === user.id)) {
            can(Action.Read, PhoneNumber); // can show own phone number
            can(Action.Update, PhoneNumber); // can update own phone number
            can(Action.Delete, PhoneNumber); // can delete own phone number
        }
    }
}
