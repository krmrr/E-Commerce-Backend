import { Action } from '../constants';
import { BaseEntity } from '../../../database/entities';
import { AppAbility, IPolicyHandler, PolicyHandler, Subject } from '../types';
import { entitiesArray, Entity } from '../../../config/mikro-orm.config';
import { allPermissionValues, PermissionType } from '../../../config/auth';

export type PermissionsInputArgument =
    | PolicyHandler
    | 'can'
    | 'cannot'
    | Action
    | Subject
    | PermissionType
    | PermissionsInputArgument[];

export function createPolicyHandlers(
    params: PermissionsInputArgument[],
    {
        defaultCondition = 'can',
        defaultAction,
        defaultSubject,
    }: {
        defaultCondition?: 'can' | 'cannot';
        defaultAction?: Action;
        defaultSubject?: Subject;
    },
): PolicyHandler[] {
    const handlers: PolicyHandler[] = [];

    function prepareHandlers(params: PermissionsInputArgument[]) {
        const arrayParams = [];
        params = params.filter((param, index) => {
            const isPermission = allPermissionValues.includes(
                param as PermissionType,
            );
            const isHandler =
                (!(
                    (param?.constructor as any) instanceof
                    BaseEntity.constructor
                ) &&
                    typeof param === 'function') ||
                typeof (param as IPolicyHandler)?.handle !== 'undefined';
            const isArray = Array.isArray(param);

            if (isPermission || isHandler) {
                handlers.push(param as PolicyHandler);
            } else if (isArray) {
                arrayParams.push(param);
            }

            return !(isPermission || isHandler || isArray);
        });

        const conditions: ('can' | 'cannot')[] = [];
        const subjects: Subject[] = [];
        const actions: Action[] = [];

        [...params].map((param, index) => {
            const isCondition = param === 'can' || param === 'cannot';
            const isSubject =
                !isCondition &&
                (param === 'all' || entitiesArray.includes(param as Entity));
            const isAction =
                !isSubject && Object.values(Action).includes(param as Action);

            if (isCondition) {
                conditions.push(param as 'can' | 'cannot');
            } else if (isSubject) {
                subjects.push(param as Subject);
            } else if (isAction) {
                actions.push(param as Action);
            }

            if (isCondition || isSubject || isAction) {
                params.splice(index, 1);
            }
        });

        const maxLength = Math.max(
            conditions.length,
            subjects.length,
            actions.length,
        );

        for (let i = 0; i < maxLength; i++) {
            const condition = conditions[i] ?? defaultCondition;
            const subject = subjects[i] ?? defaultSubject;
            const action = actions[i] ?? defaultAction;

            const handler = (ability: AppAbility) =>
                ability[condition](action, subject);
            handlers.push(handler);
        }

        if (arrayParams.length > 0) {
            arrayParams.map((param) => prepareHandlers(param));
        }
    }

    prepareHandlers(params as PermissionsInputArgument[]);

    if (handlers.length === 0) {
        const subject =
            (params as Subject[]).find(
                (param) => (param as Entity).prototype instanceof BaseEntity,
            ) ?? defaultSubject;
        if (subject) {
            const action =
                (params as Action[]).find((param) =>
                    Object.values(Action).includes(param as Action),
                ) ?? defaultAction;
            if (action) {
                const condition = (params.find((param) =>
                    ['can', 'cannot'].includes(param as 'can' | 'cannot'),
                ) ?? defaultCondition) as 'can' | 'cannot';

                const handler = (ability: AppAbility) =>
                    ability[condition](action, subject);

                handlers.push(handler);
            }
        }
    }

    if (handlers.length === 0) {
        throw new Error("Can't find any handler for this permission");
    }

    return handlers;
}
