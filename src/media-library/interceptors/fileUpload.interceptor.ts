import {
    AnyFilesInterceptor,
    FileFieldsInterceptor,
    FileInterceptor,
    FilesInterceptor,
} from '@nestjs/platform-express';
import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { join } from 'path';
import merge from 'ts-deepmerge';
import { diskStorage } from 'multer';
import {
    createMulterFilterOptions,
    editFileName,
} from '../utils/multerHelpers';
import { FileFilter, LocalFilesInterceptorOptions } from '../types';

/**
 This interceptor automatically selects the correct file interceptor based on the
 fieldNameOrFields parameter

 It takes almost same parameters described on
 https://docs.nestjs.com/techniques/file-upload

 If you want to upload array of files, you need to pass the fieldNameOrFields like
 "files[]" instead of passing "files" and the maxCount parameter. To define the maxCount,
 you need to pass the fieldNameOrFields like "files[3]"

 Also, you can set a custom path for the uploaded files by passing the path parameter on
 the localOptions object.
 **/
export function FileUploadInterceptor(
    fieldNameOrFields?: string | { name: string; maxCount?: number }[] | null,
    localOptions?: LocalFilesInterceptorOptions,
): Type<NestInterceptor> {
    function prepareMulterOptions(
        multerOptionsWithLocalOptionsFields: LocalFilesInterceptorOptions,
    ): MulterOptions {
        let multerOptions = { ...multerOptionsWithLocalOptionsFields };
        if (multerOptions.filters) {
            let args = Array.isArray(multerOptions.filters)
                ? multerOptions.filters
                : [multerOptions.filters];

            args = args.map((arg) => {
                if (typeof arg === 'function') {
                    return arg();
                }
                return arg;
            });

            const multerFilterOptions = createMulterFilterOptions(
                ...(args as FileFilter[]),
            );
            delete multerOptions.fileFilter;
            multerOptions = merge(multerOptions, multerFilterOptions);
        }
        delete multerOptions.path;
        delete multerOptions.withSquareBracketsSuffix;
        delete multerOptions.filters;
        return multerOptions as MulterOptions;
    }

    @Injectable()
    class Interceptor implements NestInterceptor {
        fileInterceptor: NestInterceptor;

        constructor(configService: ConfigService) {
            let multerOptions: MulterOptions = {
                ...configService.get('multer'),
            };

            if (localOptions) {
                multerOptions = merge(multerOptions, localOptions);

                if (localOptions.path) {
                    const filesDestination =
                        localOptions.storage?.destination ??
                        multerOptions.storage?.destination ??
                        '';
                    const destination = join(
                        filesDestination,
                        localOptions.path,
                    );

                    if (!multerOptions.storage.filename) {
                        multerOptions.storage.filename = editFileName;
                    }

                    multerOptions = merge(multerOptions, {
                        storage: {
                            destination,
                        },
                    });
                }
            }

            if (multerOptions.storage) {
                multerOptions.storage = diskStorage(multerOptions.storage);
            }

            let interceptor;
            let interceptorArgs;

            if (fieldNameOrFields === null || fieldNameOrFields === undefined) {
                interceptor = AnyFilesInterceptor;
                multerOptions = prepareMulterOptions(multerOptions);
                interceptorArgs = [multerOptions];
            } else if (Array.isArray(fieldNameOrFields)) {
                interceptor = FileFieldsInterceptor;
                const fields = fieldNameOrFields.map((field) => {
                    return {
                        ...field,
                        name:
                            field.name.endsWith('[]') ||
                            localOptions?.withSquareBracketsSuffix === false
                                ? field.name
                                : `${field.name}[]`,
                    };
                });

                multerOptions = prepareMulterOptions(multerOptions);
                interceptorArgs = [fields, multerOptions];
            }
            // check if fieldNameOrFields is a string and ends with an optional number inside square brackets. after that, save that optional number to a const and remove square brackets with optional number inside it
            else if (
                typeof fieldNameOrFields === 'string' &&
                (fieldNameOrFields.endsWith('[]') ||
                    fieldNameOrFields.match(/\[\d+\]$/))
            ) {
                const isDynamicLength = fieldNameOrFields.endsWith('[]');
                const fieldNameWithSquareBrackets = isDynamicLength
                    ? fieldNameOrFields
                    : fieldNameOrFields.replace(/\[\d+\]$/, '') + '[]';
                const fieldName =
                    localOptions?.withSquareBracketsSuffix === false
                        ? fieldNameWithSquareBrackets.replace(/\[\d+\]$/, '')
                        : fieldNameWithSquareBrackets;

                const maxCount = isDynamicLength
                    ? undefined
                    : parseInt(
                          fieldNameOrFields.replace(/^.*\[(\d+)\]$/, '$1'),
                          10,
                      );

                interceptor = FilesInterceptor;
                multerOptions = prepareMulterOptions(multerOptions);
                interceptorArgs = [fieldName, maxCount, multerOptions];
            } else {
                interceptor = FileInterceptor;
                multerOptions = prepareMulterOptions(multerOptions);
                interceptorArgs = [fieldNameOrFields, multerOptions];
            }
            this.fileInterceptor = new (interceptor(...interceptorArgs))();
        }

        intercept(...args: Parameters<NestInterceptor['intercept']>) {
            return this.fileInterceptor.intercept(...args);
        }
    }

    return mixin(Interceptor);
}
