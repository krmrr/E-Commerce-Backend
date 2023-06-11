import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { User } from '../../users/entities';
import { Entity } from '../../config/mikro-orm.config';

export interface FileFilter {
    size?: number;
    extensions?: string[];
    mimes?: string[];
    content?: string;
    contentPlural?: string;
}

export interface LocalFilesInterceptorOptions extends MulterOptions {
    path?: string;
    withSquareBracketsSuffix?: boolean;
    filters?:
        | FileFilter
        | ((filterOptions?: FileFilter & { [x: string]: any }) => FileFilter)
        | (
              | FileFilter
              | ((
                    filterOptions?: FileFilter & { [x: string]: any },
                ) => FileFilter)
          )[];
}

export type MulterFileFilter = MulterOptions['fileFilter'];
export type MulterFileFilterParams = Parameters<MulterFileFilter>;
export type MulterFileFilterFileParam = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
};

export interface FileInputOptions {
    prefix?: string;
    saveToDatabase?: boolean;
    validateMimeType?: boolean;
    disk?: string;
    details?: MediaDetails;
}

export interface BatchFileInputOptions extends FileInputOptions {
    mergeOptions?: boolean;
}

export type FileInput =
    | Express.Multer.File
    | {
          file: Express.Multer.File;
          options?: BatchFileInputOptions;
      };

export interface UploadedFile {
    originalFileName: string;
    fileName: string;
    path: string;
    size: number;
    mimeType: string;
    extension: string;
    disk: string;
}

export interface MediaDetails {
    uploader?: User;
    name?: string;
    description?: string;
    modelType?: string | Entity;
    modelId?: number;
    collectionName?: string;
    order?: number;
    manipulations?: { [key: string]: any };
    generatedConversions?: { [key: string]: boolean };
    responsiveImages?: { [key: string]: string };
    conversionsDisk?: string;
}
