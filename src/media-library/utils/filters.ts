import convert from 'convert-pro';
import { FileFilter } from '../types';

export const BASE_FILTER = (options?: FileFilter): FileFilter => {
    const {
        extensions,
        mimes,
        content,
        contentPlural,
        size = convert.bytes([20, 'MiB'], 'bytes'),
    } = options ?? {};

    const reformattedExtensions = extensions?.map((extension) => {
        const trimmedExtension = extension.trim();
        return trimmedExtension.startsWith('.')
            ? trimmedExtension
            : `.${trimmedExtension}`;
    });

    return {
        extensions: reformattedExtensions,
        mimes,
        content,
        contentPlural,
        size,
    };
};

export const IMAGE_FILTER = (
    options?:
        | FileFilter & {
              gifAllowed?: boolean;
              webpAllowed?: boolean;
          },
): FileFilter => {
    const {
        size = convert.bytes([8, 'MiB'], 'bytes'),
        gifAllowed = false,
        webpAllowed = false,
        ...rest
    } = options ?? {};
    const extensions = ['.jpg', '.jpeg', '.png'];
    const mimes = ['image/jpeg', 'image/png'];

    const content = 'image';
    const contentPlural = 'images';

    if (gifAllowed) {
        extensions.push('.gif');
        mimes.push('image/gif');
    }
    if (webpAllowed) {
        extensions.push('.webp');
        mimes.push('image/webp');
    }

    return BASE_FILTER({
        extensions,
        mimes,
        content,
        contentPlural,
        size,
        ...rest,
    });
};

export const VIDEO_FILTER = (options?: FileFilter): FileFilter => {
    const { size = convert.bytes([64, 'MiB'], 'bytes'), ...rest } =
        options ?? {};

    const extensions = ['mp4', 'mov', 'avi'];
    const mimes = ['video/mp4', 'video/mov', 'video/avi'];

    const content = 'video';
    const contentPlural = 'videos';

    return BASE_FILTER({
        extensions,
        mimes,
        content,
        contentPlural,
        size,
        ...rest,
    });
};
