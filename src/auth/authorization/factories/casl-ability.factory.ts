import {
    Ability,
    AbilityBuilder,
    AbilityClass,
    ExtractSubjectType,
} from '@casl/ability';
import { User } from '../../../users/entities';
import { Action } from '../constants';
import { Injectable } from '@nestjs/common';
import {
    abilityFactories,
    getEntityAbilityFactory,
} from '../../../config/auth';
import { AppAbility, Subject } from '../types';
import { Request } from 'express';
import { Entity } from '../../../config/mikro-orm.config';
import { BaseCaslAbilityFactory } from './base-casl-ability-factory';
import { Class } from 'type-fest';

@Injectable()
export class CaslAbilityFactory {
    async createForUser(
        user: User,
        request: Request,
        entity?: Entity,
    ): Promise<AppAbility> {
        const abilityBuilder = new AbilityBuilder<Ability<[Action, Subject]>>(
            Ability as AbilityClass<AppAbility>,
        );
        const {
            //can,
            //cannot,
            build,
        } = abilityBuilder;
        if (entity) {
            const entityAbilityFactory = getEntityAbilityFactory(
                entity,
            ) as unknown as Class<BaseCaslAbilityFactory>;

            if (!entityAbilityFactory) {
                throw new Error(
                    `No ability factory found for "${entity.constructor.name}" entity.`,
                );
            }

            for (const AbilityFactory of abilityFactories) {
                if (AbilityFactory.name === entityAbilityFactory.name) {
                    await (AbilityFactory as any).setAbilities(
                        abilityBuilder,
                        user,
                        request,
                        entity,
                    );
                } else {
                    await (AbilityFactory as any).setAbilities(
                        abilityBuilder,
                        user,
                        request,
                    );
                }
            }
        } else {
            for (const AbilityFactory of abilityFactories) {
                // @ts-ignore
                await AbilityFactory.setAbilities(
                    abilityBuilder,
                    user,
                    request,
                );
            }
        }

        return build({
            // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
            detectSubjectType: (item) =>
                item.constructor as ExtractSubjectType<Subject>,
        });
    }
}
