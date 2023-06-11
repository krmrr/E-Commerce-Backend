import { Injectable } from '@nestjs/common';
import { User } from '../../../users/entities';
import { Request } from 'express';
import { AbilityBuilderInstance, AppAbility, Subject } from '../types';
import {
    Ability,
    AbilityBuilder,
    AbilityClass,
    ExtractSubjectType,
} from '@casl/ability';
import { Action } from '../constants';

@Injectable()
export abstract class BaseCaslAbilityFactory {
    static async setAbilities(
        { can, cannot }: AbilityBuilderInstance,
        user: User,
        request: Request,
        entity?: Subject,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): Promise<void> {}

    async createForUser(
        user: User,
        request?: Request,
        entity?: Subject,
    ): Promise<AppAbility> {
        const abilityBuilder = new AbilityBuilder<Ability<[Action, Subject]>>(
            Ability as AbilityClass<AppAbility>,
        );

        const {
            //can,
            //cannot,
            build,
        } = abilityBuilder;
        // @ts-ignore
        await this.constructor.setAbilities(
            abilityBuilder,
            user,
            request,
            entity,
        );

        return build({
            // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<Subject>,
        });
    }
}
