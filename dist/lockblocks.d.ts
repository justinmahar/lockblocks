import { FieldUpdate, FieldUpdateOptions, OriginTarget, Reassignment } from './LockblocksSettings';
import { LogEvent } from './Logging';
export declare const lockblocks: (originDir: string, targetDir: string) => LogEvent[];
export declare const renameFiles: (originDirPath: string, targetDirPath: string, renameFiles: Reassignment[], excludedScanPaths: string[]) => LogEvent[];
export declare const replaceFiles: (originDirPath: string, targetDirPath: string, items: (string | OriginTarget)[], excludedScanPaths: string[]) => LogEvent[];
/**
 * Copy files only if not already present.
 */
export declare const fillFiles: (originDirPath: string, targetDirPath: string, items: (string | OriginTarget)[]) => LogEvent[];
export declare const deleteFiles: (targetDir: string, deleteFiles: string[]) => LogEvent[];
export declare const replaceCodeBlocks: (originDirPath: string, targetDirPath: string, excludedScanPaths: string[]) => LogEvent[];
export declare const updateJson: (originFilePath: string, targetFilePath: string, rootUpdateOptions: FieldUpdateOptions, renameFields: Reassignment[], updateFields: FieldUpdate[], deleteFields: string[]) => LogEvent[];
export declare const updateYaml: (originFilePath: string, targetFilePath: string, rootUpdateOptions: FieldUpdateOptions, renameFields: Reassignment[], updateFields: FieldUpdate[], deleteFields: string[]) => LogEvent[];
export declare const writeLogFile: (allEvents: LogEvent[], targetDir: string, log: string | boolean | undefined) => LogEvent[];
export declare const deleteFile: (path: string) => void;
