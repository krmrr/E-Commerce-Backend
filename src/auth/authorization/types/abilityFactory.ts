import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { Entry } from 'type-fest';
import { entities } from '../../../config/mikro-orm.config';
import { Action } from '../constants';

export type Subject = InferSubjects<Entry<typeof entities>[1]> | 'all';
export type AppAbility = Ability<[Action, Subject]>;
export type AbilityBuilderInstance = AbilityBuilder<Ability<[Action, Subject]>>;
