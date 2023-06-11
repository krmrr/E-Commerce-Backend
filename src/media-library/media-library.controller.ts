import {
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileUploadInterceptor } from './interceptors';
import { MediaLibraryService } from './media-library.service';
import { flatten } from 'lodash';
import { IMAGE_FILTER, VIDEO_FILTER } from './utils/filters';
import convert from 'convert-pro';
import { User } from '../users/entities';
import { HashedRouteParam } from '../utils/hashids';
import { Paginate, PaginateQuery } from '../utils/paginate';
import { Auth, CurrentUser } from '../auth/authentication/decorators';
import { Delete, Get, Post, Put } from '../utils/nestia';

@Controller('api/media-library')
export class MediaLibraryController {
    constructor(private readonly mediaLibraryService: MediaLibraryService) {}

    @Get()
    findAll(@Paginate() query: PaginateQuery) {
        return this.mediaLibraryService.findAll(
            { relations: ['uploader'], withDeleted: true },
            query,
        );
    }

    @Get(':id')
    findOne(@HashedRouteParam('id') id: number) {
        return this.mediaLibraryService.findOne({ id });
    }

    @Post('upload-basic')
    @UseInterceptors(
        FileUploadInterceptor('file', {
            filters: [
                VIDEO_FILTER({
                    size: convert.bytes([50, 'MiB'], 'bytes'),
                }),
                IMAGE_FILTER,
            ],
        }),
    )
    @Auth()
    basicUpload(
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const details = {
            uploader: user,
            name: 'Test Name',
            description: 'Test Description',
            modelType: User,
            modelId: 2,
            collectionName: 'Test Collection 2',
        };
        return this.mediaLibraryService.upload(file, {
            details,
            prefix: '/upload/',
        });
    }

    @Post('upload-array')
    @UseInterceptors(FileUploadInterceptor('file[]'))
    @Auth()
    arrayUpload(@UploadedFiles() files: Express.Multer.File[]) {
        return this.mediaLibraryService.batchUpload(files);
    }

    @Post('upload-multiple')
    @UseInterceptors(
        FileUploadInterceptor(
            [
                {
                    name: 'type1',
                    maxCount: 2,
                },
                {
                    name: 'type2',
                    maxCount: 3,
                },
                {
                    name: 'type3',
                },
            ],
            {
                withSquareBracketsSuffix: false,
            },
        ),
    )
    @Auth()
    multipleUpload(
        @UploadedFiles()
        files: {
            type1?: Express.Multer.File[];
            type2?: Express.Multer.File[];
            type3?: Express.Multer.File[];
        },
    ) {
        return this.mediaLibraryService.batchUpload(
            flatten(Object.values(files)),
        );
    }

    @Post('upload-any')
    @UseInterceptors(FileUploadInterceptor())
    @Auth()
    anyUpload(@UploadedFiles() files: Express.Multer.File[]) {
        return this.mediaLibraryService.batchUpload(files);
    }

    @Delete(':id')
    @Auth()
    async remove(
        @HashedRouteParam('id') id: number,
        @Headers('hard-delete') hardDelete: string,
    ) {
        const hardDeleteBool = hardDelete === 'true';
        return this.mediaLibraryService.remove(id, hardDeleteBool);
    }

    @Put(':id/restore')
    @Auth()
    async restore(@HashedRouteParam('id') id: number) {
        return this.mediaLibraryService.restore(id);
    }

    @HttpCode(HttpStatus.OK)
    @Post(':sourceId/moveAfter/:targetId')
    @Auth()
    moveAfter(
        @HashedRouteParam('sourceId') sourceId: number,
        @HashedRouteParam('targetId') targetId: number,
    ) {
        return this.mediaLibraryService.moveAfter({ sourceId, targetId });
    }

    @HttpCode(HttpStatus.OK)
    @Post(':sourceId/moveBefore/:targetId')
    @Auth()
    moveBefore(
        @HashedRouteParam('sourceId') sourceId: number,
        @HashedRouteParam('targetId') targetId: number,
    ) {
        return this.mediaLibraryService.moveBefore({ sourceId, targetId });
    }
}
