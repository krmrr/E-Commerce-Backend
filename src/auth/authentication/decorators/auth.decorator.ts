import { applyDecorators, UseGuards } from '@nestjs/common';
import { AtGuard, LocalGuard, RtGuard } from '../guards';
import { Gate } from '../types';

export function authenticationGateSelector(gate?: Gate) {
    if (!gate) gate = 'jwt';
    const gates = {
        'jwt-refresh': RtGuard,
        local: LocalGuard,
        jwt: AtGuard,
    };
    const guard = gates[gate];

    return guard;
}

export function Auth(gate?: Gate) {
    const guard = authenticationGateSelector(gate);

    return applyDecorators(UseGuards(guard));
}
