import { Action, Role } from '../../auth/authorization/constants';
import { AbilityBuilderInstance } from '../../auth/authorization/types';
import { Request } from 'express';
import { BaseCaslAbilityFactory } from '../../auth/authorization/factories/base-casl-ability-factory';
import { User } from '../../users/entities';
import {Order} from "../entities/order.entity";


export class OrdersCaslAbilityFactory extends BaseCaslAbilityFactory {

    static async setAbilities(
        { can, cannot }: AbilityBuilderInstance,
        user: User,
        request?: Request,
        entity?: Order,
    ): Promise<void> {

        const isAdmin = await user.hasRole(Role.Admin);

        if (isAdmin) {
            can(Action.Manage, Order);
            return;
        }


        can(Action.Create, Order);


    }
}
