import path, { extname } from 'path';
import { compact } from 'lodash';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import {
    FileFilter,
    MulterFileFilterFileParam,
    MulterFileFilterParams,
} from '../types';
import { importEsmModule } from '../../helpers/importing';
import { handlebars } from '../../helpers/handlebars';

export const editFileName = async (req, file, callback) => {
    const { nanoid } = (await importEsmModule(
        'nanoid',
    )) as typeof import('nanoid');
    const name = nanoid();
    const fileExtName = extname(file.originalname);
    callback(null, `${name}${fileExtName}`);
};

export function fileGuard({
    file,
    extensions,
    mimes,
}: {
    file: MulterFileFilterFileParam;
    extensions?: string[];
    mimes?: string[];
    size?: number;
}) {
    let pass = true;
    let failType: 'extension' | 'mime' | undefined;
    let failElement: string | undefined;

    const extensionRaw = path.extname(file.originalname).toLowerCase();
    const trimmedExtension = extensionRaw.trim();
    const extension = trimmedExtension.startsWith('.')
        ? trimmedExtension
        : `.${trimmedExtension}`;
    const mimetype = file.mimetype;

    if (extensions && extensions.length && !extensions.includes(extension)) {
        pass = false;
        failType = 'extension';
        failElement = extension;
    } else if (mimes && mimes.length && !mimes.includes(mimetype)) {
        pass = false;
        failType = 'mime';
        failElement = mimetype;
    }

    const result = {
        pass,
        failType,
        failElement,
    };

    return result;
}

export function makeFileFilterErrorMessage({
    file,
    failType,
    failElement,
    extensions,
    mimes,
    content,
    contentPlural,
    extensionsRaw,
    mimesRaw,
    contentRaw,
    contentPluralRaw,
    useLastElementJoinOnExtensionsStr = true,
    useLastElementJoinOnMimesStr = true,
    useLastElementJoinOnContentStr = true,
    useLastElementJoinOnContentPluralStr = true,
    joinStr = ', ',
    lastElementJoinStr = ' and ',
    messageTemplate = 'Only {{contentStr}} files are allowed.\nAllowed extensions: {{extensionsStr}}\nAllowed mimes: {{mimesStr}}\nCurrent file extension:{{file_extension}}',
}: {
    file?: MulterFileFilterFileParam;
    failType?: string;
    failElement?: string;
    extensions?: string[];
    mimes?: string[];
    content?: string[];
    contentPlural?: string[];
    extensionsRaw?: string;
    mimesRaw?: string;
    contentRaw?: string;
    contentPluralRaw?: string;
    useLastElementJoinOnExtensionsStr?: boolean;
    useLastElementJoinOnMimesStr?: boolean;
    useLastElementJoinOnContentStr?: boolean;
    useLastElementJoinOnContentPluralStr?: boolean;
    joinStr?: string;
    lastElementJoinStr?: string;
    messageTemplate?: string;
}) {
    function makeStr(
        rawText?: string,
        elementsRaw?: string[],
        addAndToStr?: boolean,
    ) {
        const elements = compact(elementsRaw);
        const extensionsStr = rawText
            ? rawText
            : elements && elements.length
            ? elements.length === 1
                ? elements[0]
                : elements.slice(0, -1).join(joinStr) +
                  (addAndToStr ? lastElementJoinStr : joinStr) +
                  elements[elements.length - 1]
            : '';

        return extensionsStr;
    }

    const extensionsStr = makeStr(
        extensionsRaw,
        extensions,
        useLastElementJoinOnExtensionsStr,
    );
    const mimesStr = makeStr(mimesRaw, mimes, useLastElementJoinOnMimesStr);
    const contentStr = makeStr(
        contentRaw,
        content,
        useLastElementJoinOnContentStr,
    );
    const contentPluralStr = makeStr(
        contentPluralRaw,
        contentPlural,
        useLastElementJoinOnContentPluralStr,
    );

    const template = handlebars.compile(messageTemplate, {});

    const message = template({
        contentStr: contentStr,
        extensionsStr: extensionsStr,
        mimesStr: mimesStr,
        contentPluralStr: contentPluralStr,
        failType: failType,
        failElement: failElement,
        file_fieldname: file?.fieldname,
        file_originalname: file?.originalname,
        file_encoding: file?.encoding,
        file_mimetype: file?.mimetype,
        file_extension: path.extname(file.originalname).toLowerCase(),
    });

    return message;
}

export const createMulterFilterOptions = (...filters: FileFilter[]) => {
    const extensions = [],
        mimes = [],
        content = [],
        contentPlural = [];

    let size = 0;
    for (const filter of filters) {
        if (filter?.size && filter.size > size) {
            size = filter.size;
        }

        extensions.push(...(filter?.extensions ?? []));
        mimes.push(...(filter?.mimes ?? []));
        content.push(filter?.content);
        contentPlural.push(filter?.contentPlural);
    }
    if (size === 0) {
        size = Infinity;
    }

    return {
        limits: {
            fileSize: size,
        },
        fileFilter: (
            req: MulterFileFilterParams[0],
            file: MulterFileFilterFileParam,
            cb: MulterFileFilterParams[2],
        ): void => {
            const extensionsAndMimesGuardResult = fileGuard({
                file,
                extensions,
                mimes,
            });

            if (extensionsAndMimesGuardResult.pass) {
                cb(null, true);
            } else {
                const errorMessage = makeFileFilterErrorMessage({
                    file,
                    extensions,
                    mimes,
                    content,
                    contentPlural,
                    failType: extensionsAndMimesGuardResult.failType,
                    failElement: extensionsAndMimesGuardResult.failElement,
                });

                cb(new UnsupportedMediaTypeException(errorMessage), false);
            }
        },
    };
};
