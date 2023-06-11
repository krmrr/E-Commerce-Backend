import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { StorageService } from '@codebrew/nestjs-storage';
import fs from 'fs-extra';
import { ConfigService } from '@nestjs/config';
import { join, relative } from 'path';
import merge from 'ts-deepmerge';
import {
    BatchFileInputOptions,
    FileInput,
    FileInputOptions,
    MediaDetails,
    UploadedFile,
} from './types';
import { EntityRepository, FilterQuery, Loaded } from '@mikro-orm/core';
import { Media } from './entities';
import { isEmpty } from 'lodash';
import { InjectRepository } from '@mikro-orm/nestjs';
import { checkIfSubDir, getRelativePath } from '../helpers/filesystem';
import {
    FilterOperator,
    paginate,
    Paginated,
    PaginateQuery,
    RelationColumn,
} from '../utils/paginate';
import { SOFT_DELETABLE_FILTER } from 'mikro-orm-soft-delete';
import type { FindOneOptions } from '@mikro-orm/core/drivers';
import { getEntityName } from '../config/mikro-orm.config';
import { importEsmModule } from '../helpers/importing';

interface FindAllArgs {
    relations?: RelationColumn<Media>[];
    withDeleted?: boolean;
}

interface FindOneArgs extends FindAllArgs {
    id: number;
}

@Injectable()
export class MediaLibraryService {
    constructor(
        private readonly storageService: StorageService,
        private readonly configService: ConfigService,
        @InjectRepository(Media)
        private mediaRepository: EntityRepository<Media>,
    ) {}

    findAll(
        args?: FindAllArgs,
        query?: PaginateQuery,
    ): Promise<Paginated<Media>> {
        const { relations } = args || {};
        const where: FilterQuery<Media> = {};

        return paginate(query, this.mediaRepository, {
            sortableColumns: ['id', 'order', 'size', 'name'],
            searchableColumns: ['name', 'fileName'],
            defaultSortBy: [
                ['order', 'asc'],
                ['id', 'desc'],
            ],
            filterableColumns: {
                name: [
                    FilterOperator.LIKE,
                    FilterOperator.EQ,
                    FilterOperator.NULL,
                    FilterOperator.NNULL,
                ],
                extension: [FilterOperator.EQ],
                fileName: [FilterOperator.LIKE, FilterOperator.EQ],
                size: [
                    FilterOperator.EQ,
                    FilterOperator.GT,
                    FilterOperator.LT,
                    FilterOperator.GTE,
                    FilterOperator.LTE,
                ],
                mimeType: [FilterOperator.EQ, FilterOperator.LIKE],
                disk: [FilterOperator.EQ],
                order: [
                    FilterOperator.EQ,
                    FilterOperator.GT,
                    FilterOperator.LT,
                    FilterOperator.GTE,
                    FilterOperator.LTE,
                ],
            },
            where,
            relations,
            withDeleted: args.withDeleted,
        });
    }

    getPath(
        uploadedPath: string,
        disk?: string,
        showRelativeFromDiskRootPath: boolean = false,
    ) {
        if (!disk) {
            disk = this.configService.get('storage.default');
        }

        const storageDriver = this.configService.get(
            `storage.disks.${disk}.driver`,
        );

        let path: string;
        if (storageDriver === 'local') {
            const rootPath = this.configService.get(
                `storage.disks.${disk}.config.root`,
            );

            path = join(rootPath, uploadedPath);
            path = getRelativePath(path);

            if (showRelativeFromDiskRootPath) {
                path = relative(rootPath, path);
            }
        } else {
            // TODO: implement other storage types
            // const storage = this.storageService.getDisk(disk);
            // path = storage.getUrl(fileName);
        }

        return path;
    }

    async validateMimeType(file: Express.Multer.File) {
        const { fileTypeFromFile } = (await importEsmModule(
            'file-type',
        )) as typeof import('file-type');
        const meta = await fileTypeFromFile(file.path);
        return meta?.mime === file.mimetype;
    }

    generateUploadedFileResponse(
        file: Express.Multer.File,
        disk?: string,
        prefix?: string,
        showRelativeFromDiskRootPath: boolean = false,
    ): UploadedFile {
        if (!disk) {
            disk = this.configService.get('storage.default');
        }
        const extension = file.filename.split('.').pop();
        const uploadedPath = join(prefix, file.filename);
        const path = this.getPath(
            uploadedPath,
            disk,
            showRelativeFromDiskRootPath,
        );

        const response = {
            originalFileName: file.originalname,
            fileName: file.filename,
            path,
            size: file.size,
            mimeType: file.mimetype,
            disk,
            extension,
        };

        return response;
    }

    async saveToDatabase(
        uploadedFileResponse: UploadedFile,
        details: MediaDetails = {},
    ) {
        const media = new Media();

        const filePath = uploadedFileResponse.path;
        const fileName = uploadedFileResponse.fileName;

        let directory = filePath.slice(0, -fileName.length);
        //replace all backslashes with forward slashes
        directory = directory.replace(/\\/g, '/');
        // add a trailing slash if it's not there
        if (!directory.startsWith('/')) {
            directory = '/' + directory;
        }
        //remove the last slash
        if (directory.endsWith('/')) {
            directory = directory.slice(0, -1);
        }

        Object.assign(media, {
            fileName: uploadedFileResponse.fileName,
            directory,
            size: uploadedFileResponse.size,
            mimeType: uploadedFileResponse.mimeType,
            disk: uploadedFileResponse.disk,
            extension: uploadedFileResponse.extension,
        });

        if (!isEmpty(details)) {
            const modelType =
                typeof details.modelType === 'string'
                    ? details.modelType
                    : getEntityName(details.modelType);

            Object.assign(media, {
                uploader: details.uploader,
                name: details.name,
                description: details.description,
                modelType,
                modelId: details.modelId,
                collectionName: details.collectionName,
                order: details.order,
                manipulations: details.manipulations,
                generatedConversions: details.generatedConversions,
                responsiveImages: details.responsiveImages,
                conversionsDisk: details.conversionsDisk,
            });
        }

        await this.mediaRepository.persistAndFlush(media);

        return media;
    }

    async findOne(
        { id, relations, withDeleted }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        const options: FindOneOptions<Media, any> = {
            populate: relations,
        };
        if (withDeleted) {
            options.filters = { [SOFT_DELETABLE_FILTER]: false };
        }

        const media = await this.mediaRepository.findOne({ id }, options);
        if (!media && throwNotFoundException) {
            throw new NotFoundException('Media not found');
        }

        return media;
    }

    async removeFromDatabase(
        idOrMedia: number | Media,
        hardDelete: boolean = false,
    ) {
        let media: Loaded<Media>;
        if (typeof idOrMedia === 'number') {
            media = await this.findOne(
                {
                    id: idOrMedia as number,
                    withDeleted: hardDelete,
                },
                true,
            );
        } else {
            media = idOrMedia;
        }

        if (hardDelete) {
            await media.hardDelete();
        } else {
            await this.mediaRepository.removeAndFlush(media);
        }
    }

    async removeFromFilesystem(filePath: string, disk: string) {
        const storage = this.storageService.getDisk(disk);
        return (await storage.delete(filePath)).wasDeleted;
    }

    async remove(id: number, hardDelete: boolean = false) {
        const media = await this.findOne({ id, withDeleted: hardDelete }, true);
        if (hardDelete) {
            const path = join(media.directory, media.fileName);
            // TODO: test this on other storage types
            await this.removeFromFilesystem(path, media.disk);
        }

        await this.removeFromDatabase(media, hardDelete);

        return true;
    }

    async restore(id: number) {
        const media = await this.findOne({ id, withDeleted: true }, true);
        await media.restore();
    }

    async upload(file: Express.Multer.File, options: FileInputOptions = {}) {
        const prefix = options.prefix ?? '';
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const uploadedFile = fs.readFileSync(file.path);
        const storage = this.storageService.getDisk(options.disk);

        const isMimeTypeValid =
            options.validateMimeType === false
                ? true
                : await this.validateMimeType(file);
        if (isMimeTypeValid) {
            let disk = options.disk;
            if (!disk) {
                disk = this.configService.get('storage.default');
            }
            const path = join(prefix, file.filename);
            const absoluteDiskRootPath = this.configService.get(
                `storage.disks.${disk}.config.root`,
            );
            const diskRootPath = getRelativePath(absoluteDiskRootPath);
            const isSubDir = checkIfSubDir(
                diskRootPath,
                join(diskRootPath, path),
            );

            if (!isSubDir) {
                throw new Error(
                    'Uploading files outside of the disk root path is not allowed.',
                );
            }

            await storage.put(join(prefix, file.filename), uploadedFile);
        }
        await fs.remove(file.path);
        if (!isMimeTypeValid) {
            throw new UnsupportedMediaTypeException(
                'Mime type mismatch for ' + file.originalname,
            );
        }

        const uploadedFileResponse = this.generateUploadedFileResponse(
            file,
            options.disk,
            prefix,
            true,
        );
        let response: Media | UploadedFile = uploadedFileResponse;
        if (options.saveToDatabase !== false) {
            const media = await this.saveToDatabase(
                uploadedFileResponse,
                options.details,
            );
            response = media;
        }

        return response;
    }

    async batchUpload(
        filesInput: FileInput[],
        batchOptions: BatchFileInputOptions = {},
    ) {
        const uploadedFiles = await Promise.all(
            (filesInput ?? []).map((fileInput) => {
                const file = (fileInput as any).file ?? fileInput;
                const singleFileOptions = (fileInput as any).options ?? {};

                let options;
                if (!singleFileOptions) {
                    options = batchOptions;
                } else if (
                    singleFileOptions.mergeOptions !== false &&
                    batchOptions.mergeOptions !== false
                ) {
                    options = merge(batchOptions, singleFileOptions);
                } else {
                    options = singleFileOptions;
                }

                delete options.mergeOptions;

                return this.upload(
                    file as Express.Multer.File,
                    options as FileInputOptions,
                );
            }),
        );

        return uploadedFiles;
    }

    async moveAfter({
        sourceId,
        targetId,
    }: {
        sourceId: number;
        targetId: number;
    }) {
        const movingItem = await this.findOne({ id: sourceId });
        const targetItem = await this.findOne({ id: targetId });

        return movingItem.moveAfter(targetItem);
    }

    async moveBefore({
        sourceId,
        targetId,
    }: {
        sourceId: number;
        targetId: number;
    }) {
        const movingItem = await this.findOne({ id: sourceId });
        const targetItem = await this.findOne({ id: targetId });

        return movingItem.moveBefore(targetItem);
    }
}
