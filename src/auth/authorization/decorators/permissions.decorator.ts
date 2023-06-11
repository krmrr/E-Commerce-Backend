import { Subject } from '../types';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../guards';
import { Action } from '../constants';
import { createPolicyHandlers, PermissionsInputArgument } from '../helpers';

const indexMethodNames = ['findAll', 'index'];
const createMethodNames = ['create', 'save'];
const readMethodNames = ['findOne', 'show', 'read'];
const updateMethodNames = ['update', 'edit'];
const deleteMethodNames = ['delete', 'destroy', 'remove'];

export const CHECK_POLICIES_KEY = Symbol('check_policy');
export const PERMISSION_ENTITY_KEY = Symbol('permissionEntity');

/**
 * Decorator for checking permissions.
 * Just send -subject, action and condition-or database permission name or handler function as input.
 * It will handle the rest.
 *
 * Supports nested arrays.
 *
 * It automatically adds @UseGuards(PermissionsGuard) to the decorated method. If you don't want that,
 * send false as first argument.
 *
 * You don't need to send every parameter. It will work even if you don't send anything as parameter
 * because it will analyse the controller and fill missing parameters with default values. It will make
 * guesses to find default values based on method name and controller's "entity" property.
 *
 *
 * You can combinate this decorator with @ResolveEntities decorator to pass a specific entity found by
 * using route-entity binding feature. Example:
 * | @Permissions('entity:params.id')
 * | @ResolveEntities({
 * |    params: {
 * |        id: PostEntity,
 * |    },
 * | })
 *
 * It uses lodash.get to resolve entity path from string, so you can also use this dot syntax to
 * retrieve entity relations. Example:
 * | @Permissions('entity:params.username.employee')
 * | @ResolveEntities({
 * |     params: {
 * |         username: User,
 * |     },
 * | })
 * ( "employee" is a One-to-One relation of User entity )
 *
 *
 * Permissions decorator usage Examples:
 * | @Permissions('can', Action.Create, PostEntity)
 * | @Permissions(Action.Update, UserEntity)
 * | @Permissions(['cannot', Action.Delete, PostEntity], Action.Delete)
 * | @Permissions((ability) => ability.cannot('delete', PostEntity))
 * | @Permissions({handle: (ability) => ability.can('show', PostEntity)})
 */
export const Permissions = (
    param1?: false | PermissionsInputArgument | string,
    ...paramsInput: (PermissionsInputArgument | string)[]
) => {
    return <TFunction extends Function, Y>(
        target: object | TFunction,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<Y>,
    ) => {
        const defaultCondition = 'can';
        const defaultSubject = (target.constructor as any).entity as Subject;
        const defaultAction = (() => {
            let action: Action;
            if (indexMethodNames.includes(propertyKey as string)) {
                action = Action.Index;
            } else if (createMethodNames.includes(propertyKey as string)) {
                action = Action.Create;
            } else if (readMethodNames.includes(propertyKey as string)) {
                action = Action.Read;
            } else if (updateMethodNames.includes(propertyKey as string)) {
                action = Action.Update;
            } else if (deleteMethodNames.includes(propertyKey as string)) {
                action = Action.Delete;
            }
            return action;
        })();

        const decorators = [UseGuards(PermissionsGuard)];

        const params = [...paramsInput];

        if (param1 === false) {
            decorators.pop();
        } else {
            if (param1 !== undefined) {
                params.unshift(param1);
            }
        }

        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            if (typeof param === 'string' && param.startsWith('entity:')) {
                const permissionEntity = param.replace('entity:', '');
                decorators.push(
                    SetMetadata(PERMISSION_ENTITY_KEY, permissionEntity),
                );
                // delete from params array without leaving it undefined
                params.splice(i, 1);
                break;
            }
        }

        const handlers = createPolicyHandlers(
            params as PermissionsInputArgument[],
            {
                defaultCondition,
                defaultSubject,
                defaultAction,
            },
        );
        decorators.push(SetMetadata(CHECK_POLICIES_KEY, handlers));

        return applyDecorators(...decorators)(target, propertyKey, descriptor);
    };
};
