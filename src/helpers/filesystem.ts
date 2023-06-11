import { dirname, isAbsolute, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { isVite } from '../config/environment';

function trimRightString(source: string, targets: string | string[]) {
    let newString = source;
    if (typeof targets === 'string') {
        targets = [targets];
    }
    targets.map((str) => {
        if (newString.endsWith(str)) {
            newString = newString.substring(0, newString.length - str.length);
        }
    });
    return newString;
}

const _filename = isVite ? fileURLToPath(process.env.rootMetaUrl) : __filename;
export const rootDirName = isVite
    ? dirname(_filename)
    : trimRightString(
          trimRightString(
              trimRightString(__dirname, ['/helpers', '\\helpers']),
              ['/src', '\\src'],
          ),
          ['/dist', '\\dist'],
      );

export function getAbsolutePath(dirnameOrFilename: string) {
    return join(rootDirName, dirnameOrFilename);
}

export function getRelativePath(dirnameOrFilename: string) {
    return relative(rootDirName, dirnameOrFilename);
}

export function checkIfSubDir(parent: string, dir: string) {
    const relativePath = relative(parent, dir);
    return (
        relativePath &&
        !relativePath.startsWith('..') &&
        !isAbsolute(relativePath)
    );
}
