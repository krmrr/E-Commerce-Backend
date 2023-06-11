import {
    ArgumentMetadata,
    Injectable,
    PipeTransform,
    UnprocessableEntityException,
} from '@nestjs/common';
import { createHashidsInstance } from './index';
import { IHashidsConfig } from './types';

@Injectable()
export class HashidsDecodePipe implements PipeTransform {
    constructor(private config?: IHashidsConfig) {}

    transform(value: any, metadata: ArgumentMetadata) {
        if (+value) {
            throw new UnprocessableEntityException('Wrong value is provided');
        }
        const hashids = createHashidsInstance(this.config);
        const decodedString = hashids.decode(value);

        return decodedString;
    }
}

@Injectable()
export class HashidsEncodePipe implements PipeTransform {
    constructor(private config?: IHashidsConfig) {}

    transform(value: any, metadata: ArgumentMetadata) {
        const hashids = createHashidsInstance(this.config);
        const encodedString = hashids.encode(value);

        return encodedString;
    }
}
