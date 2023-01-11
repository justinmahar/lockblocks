"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.writeLogFile = exports.updateYaml = exports.updateJson = exports.replaceCodeBlocks = exports.deleteFiles = exports.fillFiles = exports.replaceFiles = exports.renameFiles = exports.lockblocks = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const dir_compare_1 = require("dir-compare");
const istextorbinary_1 = require("istextorbinary");
const json_format_1 = __importDefault(require("json-format"));
// import readline from 'readline';
// import replace from 'replace-in-file';
const jsonfile_1 = __importDefault(require("jsonfile"));
const read_yaml_1 = __importDefault(require("read-yaml"));
const write_yaml_file_1 = __importDefault(require("write-yaml-file"));
const Logging_1 = require("./Logging");
const updateObject_1 = require("./updateObject");
const DEFAULT_LOG_FILE_NAME = 'lockblocks.log';
const startLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\]/;
const endLineRegex = /\[\/\s*lock:([\w\d\-_]+)\s*\]/;
const singleLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\/\]/;
const ignoreLineRegex = /\[\s*lock-ignore\s*\/\]/;
const replaceAllLineRegex = /\[\s*lock-all\s*\/\]/;
const renameLineRegex = /\[\s*lock-rename:(.+?)\s*\/\]/;
const lockblocks = (originDir, targetDir) => {
    var _a, _b;
    const settingsYamlPath = `${originDir}/lockblocks.yml`;
    const originDirExists = fs_extra_1.default.pathExistsSync(originDir);
    const targetDirExists = fs_extra_1.default.pathExistsSync(targetDir);
    const settingExists = fs_extra_1.default.pathExistsSync(settingsYamlPath);
    const events = [];
    if (!originDirExists) {
        // console.error('Error: Origin directory does not exist:', originDir);
    }
    else if (!targetDirExists) {
        // console.error('Error: Target directory does not exist:', targetDir);
    }
    else if (!settingExists) {
        // console.error('Error: lockblocks.yml does not exist in the target directory:', settingsYamlPath);
    }
    else {
        const settings = read_yaml_1.default.sync(settingsYamlPath);
        // For operations that scan all files, exclude these paths
        const excludedScanPaths = settings.excludePaths || [];
        if (excludedScanPaths.length > 0) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.info, 'lockblocks', `Excluding paths: ${excludedScanPaths.join(', ')}`);
        }
        // Rename files
        const renameFilesEvents = (0, exports.renameFiles)(originDir, targetDir, settings.renameFiles || [], excludedScanPaths);
        events.push(...renameFilesEvents);
        // Replace files
        const replaceFilesEvents = (0, exports.replaceFiles)(originDir, targetDir, settings.replaceFiles || [], excludedScanPaths);
        events.push(...replaceFilesEvents);
        // Fill files
        const fillFilesEvents = (0, exports.fillFiles)(originDir, targetDir, settings.fillFiles || []);
        events.push(...fillFilesEvents);
        // Delete files
        const deleteFilesEvents = (0, exports.deleteFiles)(targetDir, settings.deleteFiles || []);
        events.push(...deleteFilesEvents);
        // Replace code blocks
        const replaceCodeBlocksEvents = (0, exports.replaceCodeBlocks)(originDir, targetDir, excludedScanPaths);
        events.push(...replaceCodeBlocksEvents);
        // Update JSON
        (_a = settings.updateJson) === null || _a === void 0 ? void 0 : _a.forEach((itemConfig) => {
            const originPath = `${originDir}/${itemConfig.path}`;
            const targetPath = `${targetDir}/${itemConfig.path}`;
            const updateJsonEvents = (0, exports.updateJson)(originPath, targetPath, itemConfig.root, itemConfig.renameFields || [], itemConfig.updateFields || [], itemConfig.deleteFields || []);
            events.push(...updateJsonEvents);
        });
        // Update YAML
        (_b = settings.updateYaml) === null || _b === void 0 ? void 0 : _b.forEach((itemConfig) => {
            const originPath = `${originDir}/${itemConfig.path}`;
            const targetPath = `${targetDir}/${itemConfig.path}`;
            const updateYamlEvents = (0, exports.updateYaml)(originPath, targetPath, itemConfig.root, itemConfig.renameFields || [], itemConfig.updateFields || [], itemConfig.deleteFields || []);
            events.push(...updateYamlEvents);
        });
        // Write log file
        const writeLogFileEvents = (0, exports.writeLogFile)(events, targetDir, settings.log);
        events.push(...writeLogFileEvents);
    }
    return events;
};
exports.lockblocks = lockblocks;
const renameFiles = (originDirPath, targetDirPath, renameFiles, excludedScanPaths) => {
    const events = [];
    const operation = 'renameFiles';
    // Scan all source files and collect renamed file names (build on existing map)
    const filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
    filesToScan.forEach((currFile) => {
        const fileLines = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
        for (let i = 0; i < fileLines.length; i++) {
            const currLine = fileLines[i];
            const match = currLine.match(renameLineRegex);
            if (match && !ignoreLineRegex.test(currLine)) {
                const oldNameRelative = match[1];
                const newNameRelative = currFile.substring(originDirPath.length + 1);
                renameFiles.unshift({ from: oldNameRelative, to: newNameRelative });
            }
        }
    });
    // Rename all files in target dir
    renameFiles.forEach((reassignment) => {
        const fromFile = `${targetDirPath}/${reassignment.from}`;
        const toFile = `${targetDirPath}/${reassignment.to}`;
        if (fs_extra_1.default.pathExistsSync(fromFile)) {
            if (!fs_extra_1.default.pathExistsSync(toFile)) {
                if (isDirectory(fromFile)) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Renaming: ${fromFile} -> ${toFile}`, {
                        fileType: 'directory',
                    });
                    fs_extra_1.default.ensureDirSync(toFile);
                    fs_extra_1.default.moveSync(fromFile, toFile, { overwrite: true });
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Renaming: ${fromFile} -> ${toFile}`, { fileType: 'file' });
                    fs_extra_1.default.ensureFileSync(toFile);
                    fs_extra_1.default.moveSync(fromFile, toFile, { overwrite: true });
                }
            }
            else {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.info, operation, `Skipping renaming. File already exists: ${fromFile} -> ${toFile}`);
            }
        }
    });
    return events;
};
exports.renameFiles = renameFiles;
const replaceFiles = (originDirPath, targetDirPath, items, excludedScanPaths) => {
    const events = [];
    const operation = 'replaceFiles';
    // First, replace all explicitly defined files
    items.forEach((itemConfig) => {
        const originPath = `${originDirPath}/${typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target}`;
        const targetPath = `${targetDirPath}/${typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin}`;
        const originFileExists = fs_extra_1.default.pathExistsSync(originPath);
        if (originFileExists) {
            let same = false;
            const targetFileExists = fs_extra_1.default.pathExistsSync(targetPath);
            if (targetFileExists) {
                const comparisonResults = (0, dir_compare_1.compareSync)(originPath, targetPath, { compareContent: true });
                same = !!(comparisonResults === null || comparisonResults === void 0 ? void 0 : comparisonResults.same);
            }
            // Only replace if there are differences or target doesn't exist
            if ((targetFileExists && !same) || !targetFileExists) {
                let originFileIsDir = false;
                try {
                    originFileIsDir = isDirectory(originPath);
                }
                catch (e) { }
                if (!originFileIsDir) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Replacing: ${originPath} -> ${targetPath}`, {
                        fileType: 'file',
                    });
                    // Replace file
                    fs_extra_1.default.ensureFileSync(targetPath);
                    fs_extra_1.default.copySync(originPath, targetPath, { overwrite: true });
                }
                else {
                    // Replace directory
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Replacing: ${originPath} -> ${targetPath}`, {
                        fileType: 'directory',
                    });
                    // Delete target dir first if it exists
                    if (targetFileExists) {
                        fs_extra_1.default.rmSync(targetPath, { recursive: true, force: true });
                    }
                    // Recursively copy origin dir to target dir
                    fs_extra_1.default.copySync(originPath, targetPath);
                }
            }
        }
    });
    // Now, filter and scan all files for the lock-all tag
    const filesToScan = filterExcludedFiles(targetDirPath, getAllFiles(targetDirPath), excludedScanPaths, true);
    filesToScan.forEach((currFile) => {
        const fileLines = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
        let originMarkedForReplace = false;
        for (let i = 0; i < fileLines.length; i++) {
            const currLine = fileLines[i];
            originMarkedForReplace = replaceAllLineRegex.test(currLine) && !ignoreLineRegex.test(currLine);
            if (originMarkedForReplace) {
                break;
            }
        }
        if (originMarkedForReplace) {
            // Now check if the line is present in the target file
            const fileLines = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
            let shouldReplaceTargetFile = false;
            for (let i = 0; i < fileLines.length; i++) {
                const currLine = fileLines[i];
                shouldReplaceTargetFile = replaceAllLineRegex.test(currLine) && !ignoreLineRegex.test(currLine);
                if (shouldReplaceTargetFile) {
                    break;
                }
            }
            // If we found the tag in both the origin and the target...
            if (shouldReplaceTargetFile) {
                const originFilePath = `${originDirPath}/${currFile.substring(targetDirPath.length + 1)}`;
                if (fs_extra_1.default.pathExistsSync(originFilePath) && !isDirectory(originFilePath)) {
                    // Only replace the file if it changed in any way
                    if (fs_extra_1.default.readFileSync(currFile).toString() !== fs_extra_1.default.readFileSync(originFilePath).toString()) {
                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Replacing: ${originFilePath} -> ${currFile}`, {
                            fileType: 'file',
                        });
                        fs_extra_1.default.copySync(originFilePath, currFile, { overwrite: true });
                    }
                }
            }
        }
    });
    return events;
};
exports.replaceFiles = replaceFiles;
/**
 * Copy files only if not already present.
 */
const fillFiles = (originDirPath, targetDirPath, items) => {
    const events = [];
    const operation = 'fillFiles';
    items.forEach((itemConfig) => {
        const originPath = `${originDirPath}/${typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target}`;
        const targetPath = `${targetDirPath}/${typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin}`;
        if (fs_extra_1.default.pathExistsSync(originPath)) {
            if (isDirectory(originPath)) {
                if (!fs_extra_1.default.pathExistsSync(targetPath)) {
                    fs_extra_1.default.ensureDirSync(targetPath);
                }
                if (isDirectory(targetPath)) {
                    // Get all files in the origin directory, and copy to the target dir if non-existent there
                    const originFiles = getAllFiles(originPath);
                    originFiles.forEach((currOriginFile) => {
                        const targetFilePath = `${targetPath}/${currOriginFile.substring(originPath.length + 1)}`;
                        if (!fs_extra_1.default.pathExistsSync(targetFilePath)) {
                            try {
                                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Filling in missing directory: ${targetFilePath}`, {
                                    fileType: 'directory',
                                });
                                fs_extra_1.default.copySync(currOriginFile, targetFilePath, { overwrite: false });
                            }
                            catch (e) {
                                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `${e}`);
                            }
                        }
                    });
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `Target directory was a file, not a directory. Tried to fill from: ${originPath} -> ${targetPath}`);
                }
            }
            else {
                if (!fs_extra_1.default.pathExistsSync(targetPath)) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Filling in missing file: ${targetPath}`, {
                        fileType: 'file',
                    });
                    fs_extra_1.default.ensureFileSync(targetPath);
                    fs_extra_1.default.copySync(originPath, targetPath, { overwrite: true });
                }
            }
        }
    });
    return events;
};
exports.fillFiles = fillFiles;
const deleteFiles = (targetDir, deleteFiles) => {
    const operation = 'deleteFiles';
    const events = [];
    deleteFiles === null || deleteFiles === void 0 ? void 0 : deleteFiles.forEach((path) => {
        const deletePath = `${targetDir}/${path}`;
        if (fs_extra_1.default.pathExistsSync(deletePath)) {
            const isDir = isDirectory(deletePath);
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Deleting ${isDir ? 'directory' : 'file'}: ${deletePath}`, {
                fileType: isDir ? 'directory' : 'file',
            });
            (0, exports.deleteFile)(deletePath);
        }
    });
    return events;
};
exports.deleteFiles = deleteFiles;
const replaceCodeBlocks = (originDirPath, targetDirPath, excludedScanPaths) => {
    const events = [];
    const operation = 'replaceCodeBlocks';
    // Scan all non-excluded files in origin dir
    const filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
    const originCodeBlocks = {};
    filesToScan.forEach((currOriginFile) => {
        const currRelativeFilePath = currOriginFile.substring(originDirPath.length + 1);
        const currCodeBlocks = {};
        originCodeBlocks[currRelativeFilePath] = currCodeBlocks;
        // For each file, read file, split on newline
        const originFileLines = fs_extra_1.default.readFileSync(currOriginFile).toString().split('\n');
        let currentBlockName = undefined;
        // Store the names and array of lines of complete code blocks, error/skip file for incomplete
        for (let i = 0; i < originFileLines.length; i++) {
            const currOriginFileLine = originFileLines[i];
            if (typeof currentBlockName !== 'string') {
                const match = currOriginFileLine.match(startLineRegex);
                if (match && !ignoreLineRegex.test(currOriginFileLine)) {
                    const foundBlockName = match[1];
                    if (typeof foundBlockName === 'string') {
                        currentBlockName = foundBlockName;
                        currCodeBlocks[currentBlockName] = [currOriginFileLine];
                    }
                }
                else {
                    const singleLineMatch = currOriginFileLine.match(singleLineRegex);
                    if (singleLineMatch && !ignoreLineRegex.test(currOriginFileLine)) {
                        const foundBlockName = singleLineMatch[1];
                        currCodeBlocks[foundBlockName] = [currOriginFileLine];
                    }
                }
            }
            else {
                // Else we are inside a code block, search for closing tag
                const match = currOriginFileLine.match(endLineRegex);
                if (match && !ignoreLineRegex.test(currOriginFileLine)) {
                    const foundBlockName = match[1];
                    if (currentBlockName === foundBlockName) {
                        currCodeBlocks[currentBlockName].push(currOriginFileLine);
                        currentBlockName = undefined;
                    }
                }
                else {
                    currCodeBlocks[currentBlockName].push(currOriginFileLine);
                }
            }
        }
        if (typeof currentBlockName === 'string') {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `Missing closing lock for code block ${currentBlockName} in file ${currOriginFile}. Skipping file.`);
            delete originCodeBlocks[currRelativeFilePath];
        }
        else {
            // If at least one present, check for corresponding file in target, warn if missing
            const originCodeBlockNames = Object.keys(originCodeBlocks[currRelativeFilePath]);
            if (originCodeBlockNames.length > 0) {
                const targetFilePath = `${targetDirPath}/${currRelativeFilePath}`;
                if (fs_extra_1.default.pathExistsSync(targetFilePath)) {
                    // Create a merged lines array. Fill line by line.
                    const mergedFileLines = [];
                    // Split target file on newline
                    const targetFileLines = fs_extra_1.default.readFileSync(targetFilePath).toString().split('\n');
                    let currentBlockName = undefined;
                    let oldBlockLines = [];
                    const replacedCodeBlocks = [];
                    for (let i = 0; i < targetFileLines.length; i++) {
                        const currTargetFileLine = targetFileLines[i];
                        // Check for code blocks. Once hit, check if it exists in origin, warn if not.
                        if (typeof currentBlockName !== 'string') {
                            const match = currTargetFileLine.match(startLineRegex);
                            if (match && !ignoreLineRegex.test(currTargetFileLine)) {
                                const foundBlockName = match[1];
                                if (typeof foundBlockName === 'string') {
                                    currentBlockName = foundBlockName;
                                    oldBlockLines.push(currTargetFileLine);
                                }
                            }
                            else {
                                const singleLineMatch = currTargetFileLine.match(singleLineRegex);
                                if (singleLineMatch && !ignoreLineRegex.test(currTargetFileLine)) {
                                    const foundBlockName = singleLineMatch[1];
                                    // If exists in origin, use origin blocks.
                                    if (originCodeBlockNames.includes(foundBlockName)) {
                                        replacedCodeBlocks.push(foundBlockName);
                                        mergedFileLines.push(...currCodeBlocks[foundBlockName]);
                                    }
                                    else {
                                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, `Couldn't find single code block line ${foundBlockName} in origin file ${currOriginFile}. Please check if the code block line was removed.`);
                                        // If the block wasn't found in the origin, still carry it over.
                                        mergedFileLines.push(currTargetFileLine);
                                    }
                                }
                                else {
                                    mergedFileLines.push(currTargetFileLine);
                                }
                            }
                        }
                        else {
                            oldBlockLines.push(currTargetFileLine);
                            // Else we are inside a code block, search for closing tag
                            const match = currTargetFileLine.match(endLineRegex);
                            if (match && !ignoreLineRegex.test(currTargetFileLine)) {
                                const foundBlockName = match[1];
                                if (currentBlockName === foundBlockName) {
                                    // If exists in origin, use origin blocks.
                                    if (originCodeBlockNames.includes(foundBlockName)) {
                                        replacedCodeBlocks.push(currentBlockName);
                                        mergedFileLines.push(...currCodeBlocks[currentBlockName]);
                                    }
                                    else {
                                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, `Couldn't find code block [${currentBlockName}] in origin file ${currOriginFile}. Please check if the code block was removed.`);
                                        // If the block wasn't found in the origin, still carry it over.
                                        mergedFileLines.push(...oldBlockLines);
                                    }
                                    oldBlockLines = [];
                                    currentBlockName = undefined;
                                }
                            }
                        }
                    }
                    // If no errors, write resulting file to target file, overwriting it.
                    if (typeof currentBlockName === 'undefined') {
                        const missingBlockNames = originCodeBlockNames.filter((name) => !replacedCodeBlocks.includes(name));
                        if (replacedCodeBlocks.length !== originCodeBlockNames.length) {
                            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, `Expected code block(s) [${missingBlockNames.join('], [')}] were missing from the target file: ${targetFilePath}. If these were removed intentionally, ignore this warning.`);
                        }
                        const previousFileContents = targetFileLines.join('\n');
                        const updatedFileContents = mergedFileLines.join('\n');
                        if (previousFileContents !== updatedFileContents) {
                            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Replacing code blocks: [${replacedCodeBlocks.join('], [')}] in ${targetFilePath}.`);
                            fs_extra_1.default.writeFileSync(targetFilePath, updatedFileContents);
                        }
                    }
                    else {
                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `Missing closing lock for code block ${currentBlockName} in file ${targetFilePath}. Skipping file.`);
                    }
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, `Corresponding code blocks file not found: ${targetFilePath} (code blocks [${originCodeBlockNames.join('], [')}])`);
                }
            }
        }
    });
    return events;
};
exports.replaceCodeBlocks = replaceCodeBlocks;
const updateJson = (originFilePath, targetFilePath, rootUpdateOptions, renameFields, updateFields, deleteFields) => {
    const events = [];
    const operation = 'updateJson';
    // Read origin JSON
    const originObj = jsonfile_1.default.readFileSync(originFilePath);
    // Read target JSON
    const originalTargetObj = jsonfile_1.default.readFileSync(targetFilePath);
    const targetObj = jsonfile_1.default.readFileSync(targetFilePath);
    if (typeof originObj === 'object' && typeof targetObj === 'object') {
        const updatedObject = (0, updateObject_1.updateObject)(originObj, targetObj, rootUpdateOptions, renameFields, updateFields, deleteFields);
        // Overwrite target file with updated, formatted JSON
        const jsonFormattingConfig = {
            type: 'space',
            size: 2,
        };
        try {
            const previousJsonBlob = JSON.stringify(originalTargetObj);
            const updatedJsonBlob = JSON.stringify(updatedObject);
            if (previousJsonBlob !== updatedJsonBlob) {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Updating JSON file: ${targetFilePath}`);
                fs_extra_1.default.writeFileSync(targetFilePath, (0, json_format_1.default)(updatedObject, jsonFormattingConfig) + '\n');
            }
        }
        catch (err) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `Couldn't update JSON file: ${targetFilePath}. Error: ${err}`);
        }
    }
    return events;
};
exports.updateJson = updateJson;
const updateYaml = (originFilePath, targetFilePath, rootUpdateOptions, renameFields, updateFields, deleteFields) => {
    const events = [];
    const operation = 'updateYaml';
    // Read origin YAML
    const originObj = read_yaml_1.default.sync(originFilePath);
    // Read target YAML
    const originalTargetObj = read_yaml_1.default.sync(targetFilePath);
    const targetObj = read_yaml_1.default.sync(targetFilePath);
    if (typeof originObj === 'object' && typeof targetObj === 'object') {
        const updatedObject = (0, updateObject_1.updateObject)(originObj, targetObj, rootUpdateOptions, renameFields, updateFields, deleteFields);
        // Overwrite target file with updated, formatted YAML
        try {
            const previousJsonBlob = JSON.stringify(originalTargetObj);
            const updatedJsonBlob = JSON.stringify(updatedObject);
            if (previousJsonBlob !== updatedJsonBlob) {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Updating YAML file: ${targetFilePath}`);
                write_yaml_file_1.default.sync(targetFilePath, updatedObject);
            }
        }
        catch (err) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, `Couldn't update YAML file: ${targetFilePath}. Error: ${err}`);
        }
    }
    return events;
};
exports.updateYaml = updateYaml;
const writeLogFile = (allEvents, targetDir, log) => {
    const operation = 'writeLogFile';
    const events = [];
    // If log is truthy, or was unspecified (log by default)
    if (log || typeof log === 'undefined') {
        const logFileName = typeof log === 'string' ? log : DEFAULT_LOG_FILE_NAME;
        const logFilePath = `${targetDir}/${logFileName}`;
        if (fs_extra_1.default.pathExistsSync(logFilePath)) {
            (0, exports.deleteFile)(logFilePath);
        }
        const jsonFormattingConfig = {
            type: 'space',
            size: 2,
        };
        try {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, `Saving log to: ${logFilePath}`, { path: logFilePath });
            fs_extra_1.default.ensureFileSync(logFilePath);
            fs_extra_1.default.writeFileSync(logFilePath, (0, json_format_1.default)([...allEvents, ...events], jsonFormattingConfig) + '\n');
        }
        catch (err) {
            console.error(err);
        }
    }
    return events;
};
exports.writeLogFile = writeLogFile;
// === === === === === === === === === === === === === === === === ===
// --- Utilities ---
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs_extra_1.default.readdirSync(dirPath);
    files.forEach((file) => {
        const fullFilePath = `${dirPath}/${file}`;
        if (isDirectory(fullFilePath)) {
            arrayOfFiles = getAllFiles(fullFilePath, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(fullFilePath);
        }
    });
    return arrayOfFiles;
};
const filterExcludedFiles = (dirPath, allFiles, excludedPaths, textFilesOnly) => {
    return allFiles.filter((fileName) => {
        const relativeFileName = fileName.substring(dirPath.length + 1);
        let excluded = !!excludedPaths.find((excludedPath) => {
            return relativeFileName === excludedPath || relativeFileName.indexOf(`${excludedPath}/`) === 0;
        });
        if (!excluded && textFilesOnly) {
            excluded = !isTextFile(fileName);
        }
        return !excluded;
    });
};
const isDirectory = (file) => {
    var _a;
    return !!((_a = fs_extra_1.default.statSync(file, { throwIfNoEntry: false })) === null || _a === void 0 ? void 0 : _a.isDirectory());
};
const isTextFile = (file) => {
    let fileIsText = !!(0, istextorbinary_1.isText)(file);
    if (!fileIsText) {
        const fileContents = fs_extra_1.default.readFileSync(file);
        fileIsText = !!(0, istextorbinary_1.isText)(null, fileContents);
    }
    return fileIsText;
};
const deleteFile = (path) => {
    // // console.log('=== deleteFile ===');
    try {
        // console.log('Deleting:', path, isDirectory(path) ? '(directory)' : '(file)');
        fs_extra_1.default.rmSync(path, { recursive: true, force: true });
    }
    catch (e) { }
};
exports.deleteFile = deleteFile;
