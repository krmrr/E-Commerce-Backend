import { AppAbility } from './abilityFactory';
import { PermissionType } from '../../../config/auth';

export interface IPolicyHandler {
    handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler =
    | IPolicyHandler
    | PolicyHandlerCallback
    | PermissionType;
