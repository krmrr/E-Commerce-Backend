import { Action, Role } from '../../auth/authorization/constants';
import { User } from '../../users/entities';
import { Post } from '../entities';
import { AbilityBuilderInstance } from '../../auth/authorization/types';
import { Request } from 'express';
import { BaseCaslAbilityFactory } from '../../auth/authorization/factories/base-casl-ability-factory';

export class PostCaslAbilityFactory extends BaseCaslAbilityFactory {
    static async setAbilities(
        { can, cannot }: AbilityBuilderInstance,
        user: User,
        request?: Request,
        entity?: Post,
    ): Promise<void> {
        const isAdmin = await user.hasRole(Role.Admin);

        if (isAdmin) {
            can(Action.Manage, Post);
        } else {
            can(Action.Create, Post);
            can(Action.Read, Post);
            can(Action.Index, Post);
        }

        if (entity?.author.id === user.id) {
            can(Action.Update, Post); // can update own posts
            can(Action.Delete, Post); // can remove own posts
        }
    }
}
