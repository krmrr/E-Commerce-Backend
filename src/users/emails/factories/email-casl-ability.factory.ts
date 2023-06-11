import { Action, Role } from '../../../auth/authorization/constants';
import { User } from '../../entities';
import { AbilityBuilderInstance } from '../../../auth/authorization/types';
import { Request } from 'express';
import { BaseCaslAbilityFactory } from '../../../auth/authorization/factories/base-casl-ability-factory';
import { Email } from '../entities';
import { EmailPermission } from '../constants';

export class EmailCaslAbilityFactory extends BaseCaslAbilityFactory {
    static async setAbilities(
        { can, cannot }: AbilityBuilderInstance,
        user: User,
        request: Request,
        entity?: Email,
    ): Promise<void> {
        const isAdmin = await user.hasRole(Role.Admin);

        if (isAdmin) {
            can(Action.Manage, Email);
        }

        const userIdHeader = request.query['userId'] as string | undefined;
        const isListingOthersEmail =
            userIdHeader && userIdHeader !== user.hashid();

        if (
            !isListingOthersEmail ||
            (await user.hasPermission(EmailPermission.ListOthersEmails))
        ) {
            can(Action.Index, Email);
        }

        can(Action.Create, Email);

        /** We also allow read, update and delete if entity is undefined. If we don't do this, we will get "403 Forbidden"
         * instead of "404 Not Found".
         */
        if (!entity || (entity && entity.user.id === user.id)) {
            can(Action.Read, Email); // can show own phone number
            can(Action.Update, Email); // can update own phone number
            can(Action.Delete, Email); // can delete own phone number
        }
    }
}
