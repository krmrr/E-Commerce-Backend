/**
 * Use this function to import an esm module. Example:
 * const { fileTypeFromFile } = (await importEsmModule('file-type')) as typeof import('file-type');
 * @param moduleName
 */
export async function importEsmModule(moduleName: string) {
    return await eval('import(moduleName)');
}
