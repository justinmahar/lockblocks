"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.writeLogFile = exports.updateYaml = exports.updateJson = exports.replaceCodeBlocks = exports.deleteFiles = exports.fillFiles = exports.replaceFiles = exports.renameFiles = exports.lockblocks = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var dir_compare_1 = require("dir-compare");
var istextorbinary_1 = require("istextorbinary");
var json_format_1 = __importDefault(require("json-format"));
// import readline from 'readline';
// import replace from 'replace-in-file';
var jsonfile_1 = __importDefault(require("jsonfile"));
var read_yaml_1 = __importDefault(require("read-yaml"));
var write_yaml_file_1 = __importDefault(require("write-yaml-file"));
var Logging_1 = require("./Logging");
var updateObject_1 = require("./updateObject");
var DEFAULT_LOG_FILE_NAME = 'lockblocks.log';
var startLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\]/;
var endLineRegex = /\[\/\s*lock:([\w\d\-_]+)\s*\]/;
var singleLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\/\]/;
var ignoreLineRegex = /\[\s*lock-ignore\s*\/\]/;
var replaceAllLineRegex = /\[\s*lock-all\s*\/\]/;
var renameLineRegex = /\[\s*lock-rename:(.+?)\s*\/\]/;
var lockblocks = function (originDir, targetDir) {
    var _a, _b;
    var settingsYamlPath = "".concat(originDir, "/lockblocks.yml");
    var originDirExists = fs_extra_1.default.pathExistsSync(originDir);
    var targetDirExists = fs_extra_1.default.pathExistsSync(targetDir);
    var settingExists = fs_extra_1.default.pathExistsSync(settingsYamlPath);
    var events = [];
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
        var settings = read_yaml_1.default.sync(settingsYamlPath);
        // For operations that scan all files, exclude these paths
        var excludedScanPaths = settings.excludePaths || [];
        if (excludedScanPaths.length > 0) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.info, 'lockblocks', "Excluding paths: ".concat(excludedScanPaths.join(', ')));
        }
        // Rename files
        var renameFilesEvents = (0, exports.renameFiles)(originDir, targetDir, settings.renameFiles || [], excludedScanPaths);
        events.push.apply(events, renameFilesEvents);
        // Replace files
        var replaceFilesEvents = (0, exports.replaceFiles)(originDir, targetDir, settings.replaceFiles || [], excludedScanPaths);
        events.push.apply(events, replaceFilesEvents);
        // Fill files
        var fillFilesEvents = (0, exports.fillFiles)(originDir, targetDir, settings.fillFiles || []);
        events.push.apply(events, fillFilesEvents);
        // Delete files
        var deleteFilesEvents = (0, exports.deleteFiles)(targetDir, settings.deleteFiles || []);
        events.push.apply(events, deleteFilesEvents);
        // Replace code blocks
        var replaceCodeBlocksEvents = (0, exports.replaceCodeBlocks)(originDir, targetDir, excludedScanPaths);
        events.push.apply(events, replaceCodeBlocksEvents);
        // Update JSON
        (_a = settings.updateJson) === null || _a === void 0 ? void 0 : _a.forEach(function (itemConfig) {
            var originPath = "".concat(originDir, "/").concat(itemConfig.path);
            var targetPath = "".concat(targetDir, "/").concat(itemConfig.path);
            var updateJsonEvents = (0, exports.updateJson)(originPath, targetPath, itemConfig.root, itemConfig.renameFields || [], itemConfig.updateFields || [], itemConfig.deleteFields || []);
            events.push.apply(events, updateJsonEvents);
        });
        // Update YAML
        (_b = settings.updateYaml) === null || _b === void 0 ? void 0 : _b.forEach(function (itemConfig) {
            var originPath = "".concat(originDir, "/").concat(itemConfig.path);
            var targetPath = "".concat(targetDir, "/").concat(itemConfig.path);
            var updateYamlEvents = (0, exports.updateYaml)(originPath, targetPath, itemConfig.root, itemConfig.renameFields || [], itemConfig.updateFields || [], itemConfig.deleteFields || []);
            events.push.apply(events, updateYamlEvents);
        });
        // Write log file
        var writeLogFileEvents = (0, exports.writeLogFile)(events, targetDir, settings.log);
        events.push.apply(events, writeLogFileEvents);
    }
    return events;
};
exports.lockblocks = lockblocks;
var renameFiles = function (originDirPath, targetDirPath, renameFiles, excludedScanPaths) {
    var events = [];
    var operation = 'renameFiles';
    // Scan all source files and collect renamed file names (build on existing map)
    var filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
    filesToScan.forEach(function (currFile) {
        var fileLines = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
        for (var i = 0; i < fileLines.length; i++) {
            var currLine = fileLines[i];
            var match = currLine.match(renameLineRegex);
            if (match && !ignoreLineRegex.test(currLine)) {
                var oldNameRelative = match[1];
                var newNameRelative = currFile.substring(originDirPath.length + 1);
                renameFiles.unshift({ from: oldNameRelative, to: newNameRelative });
            }
        }
    });
    // Rename all files in target dir
    renameFiles.forEach(function (reassignment) {
        var fromFile = "".concat(targetDirPath, "/").concat(reassignment.from);
        var toFile = "".concat(targetDirPath, "/").concat(reassignment.to);
        if (fs_extra_1.default.pathExistsSync(fromFile)) {
            if (!fs_extra_1.default.pathExistsSync(toFile)) {
                if (isDirectory(fromFile)) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Renaming: ".concat(fromFile, " -> ").concat(toFile), {
                        fileType: 'directory',
                    });
                    fs_extra_1.default.ensureDirSync(toFile);
                    fs_extra_1.default.moveSync(fromFile, toFile, { overwrite: true });
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Renaming: ".concat(fromFile, " -> ").concat(toFile), { fileType: 'file' });
                    fs_extra_1.default.ensureFileSync(toFile);
                    fs_extra_1.default.moveSync(fromFile, toFile, { overwrite: true });
                }
            }
            else {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.info, operation, "Skipping renaming. File already exists: ".concat(fromFile, " -> ").concat(toFile));
            }
        }
    });
    return events;
};
exports.renameFiles = renameFiles;
var replaceFiles = function (originDirPath, targetDirPath, items, excludedScanPaths) {
    var events = [];
    var operation = 'replaceFiles';
    // First, replace all explicitly defined files
    items.forEach(function (itemConfig) {
        var originPath = "".concat(originDirPath, "/").concat(typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target);
        var targetPath = "".concat(targetDirPath, "/").concat(typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin);
        var originFileExists = fs_extra_1.default.pathExistsSync(originPath);
        if (originFileExists) {
            var destinationIsDir = false;
            try {
                destinationIsDir = isDirectory(targetPath);
            }
            catch (e) { }
            var same = false;
            var targetFileExists = fs_extra_1.default.pathExistsSync(targetPath);
            if (targetFileExists) {
                var comparisonResults = (0, dir_compare_1.compareSync)(originPath, targetPath, { compareContent: true });
                same = !!(comparisonResults === null || comparisonResults === void 0 ? void 0 : comparisonResults.same);
            }
            // Only replace if there are differences or target doesn't exist
            if ((targetFileExists && !same) || !targetFileExists) {
                if (!destinationIsDir) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Replacing: ".concat(originPath, " -> ").concat(targetPath), {
                        fileType: 'file',
                    });
                    // Replace file
                    fs_extra_1.default.ensureFileSync(targetPath);
                    fs_extra_1.default.copySync(originPath, targetPath, { overwrite: true });
                }
                else {
                    // Replace directory
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Replacing: ".concat(originPath, " -> ").concat(targetPath), {
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
    var filesToScan = filterExcludedFiles(targetDirPath, getAllFiles(targetDirPath), excludedScanPaths, true);
    filesToScan.forEach(function (currFile) {
        var fileLines = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
        var originMarkedForReplace = false;
        for (var i = 0; i < fileLines.length; i++) {
            var currLine = fileLines[i];
            originMarkedForReplace = replaceAllLineRegex.test(currLine) && !ignoreLineRegex.test(currLine);
            if (originMarkedForReplace) {
                break;
            }
        }
        if (originMarkedForReplace) {
            // Now check if the line is present in the target file
            var fileLines_1 = fs_extra_1.default.readFileSync(currFile).toString().split('\n');
            var shouldReplaceTargetFile = false;
            for (var i = 0; i < fileLines_1.length; i++) {
                var currLine = fileLines_1[i];
                shouldReplaceTargetFile = replaceAllLineRegex.test(currLine) && !ignoreLineRegex.test(currLine);
                if (shouldReplaceTargetFile) {
                    break;
                }
            }
            // If we found the tag in both the origin and the target...
            if (shouldReplaceTargetFile) {
                var originFilePath = "".concat(originDirPath, "/").concat(currFile.substring(targetDirPath.length + 1));
                if (fs_extra_1.default.pathExistsSync(originFilePath) && !isDirectory(originFilePath)) {
                    // Only replace the file if it changed in any way
                    if (fs_extra_1.default.readFileSync(currFile).toString() !== fs_extra_1.default.readFileSync(originFilePath).toString()) {
                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Replacing: ".concat(originFilePath, " -> ").concat(currFile), {
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
var fillFiles = function (originDirPath, targetDirPath, items) {
    var events = [];
    var operation = 'fillFiles';
    items.forEach(function (itemConfig) {
        var originPath = "".concat(originDirPath, "/").concat(typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target);
        var targetPath = "".concat(targetDirPath, "/").concat(typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin);
        if (fs_extra_1.default.pathExistsSync(originPath)) {
            if (isDirectory(originPath)) {
                if (!fs_extra_1.default.pathExistsSync(targetPath)) {
                    fs_extra_1.default.ensureDirSync(targetPath);
                }
                if (isDirectory(targetPath)) {
                    // Get all files in the origin directory, and copy to the target dir if non-existent there
                    var originFiles = getAllFiles(originPath);
                    originFiles.forEach(function (currOriginFile) {
                        var targetFilePath = "".concat(targetPath, "/").concat(currOriginFile.substring(originPath.length + 1));
                        if (!fs_extra_1.default.pathExistsSync(targetFilePath)) {
                            try {
                                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Filling in missing directory: ".concat(targetFilePath), {
                                    fileType: 'directory',
                                });
                                fs_extra_1.default.copySync(currOriginFile, targetFilePath, { overwrite: false });
                            }
                            catch (e) {
                                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "".concat(e));
                            }
                        }
                    });
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "Target directory was a file, not a directory. Tried to fill from: ".concat(originPath, " -> ").concat(targetPath));
                }
            }
            else {
                if (!fs_extra_1.default.pathExistsSync(targetPath)) {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Filling in missing file: ".concat(targetPath), {
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
var deleteFiles = function (targetDir, deleteFiles) {
    var operation = 'deleteFiles';
    var events = [];
    deleteFiles === null || deleteFiles === void 0 ? void 0 : deleteFiles.forEach(function (path) {
        var deletePath = "".concat(targetDir, "/").concat(path);
        if (fs_extra_1.default.pathExistsSync(deletePath)) {
            var isDir = isDirectory(deletePath);
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Deleting ".concat(isDir ? 'directory' : 'file', ": ").concat(deletePath), {
                fileType: isDir ? 'directory' : 'file',
            });
            (0, exports.deleteFile)(deletePath);
        }
    });
    return events;
};
exports.deleteFiles = deleteFiles;
var replaceCodeBlocks = function (originDirPath, targetDirPath, excludedScanPaths) {
    var events = [];
    var operation = 'replaceCodeBlocks';
    // Scan all non-excluded files in origin dir
    var filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
    var originCodeBlocks = {};
    filesToScan.forEach(function (currOriginFile) {
        var currRelativeFilePath = currOriginFile.substring(originDirPath.length + 1);
        var currCodeBlocks = {};
        originCodeBlocks[currRelativeFilePath] = currCodeBlocks;
        // For each file, read file, split on newline
        var originFileLines = fs_extra_1.default.readFileSync(currOriginFile).toString().split('\n');
        var currentBlockName = undefined;
        // Store the names and array of lines of complete code blocks, error/skip file for incomplete
        for (var i = 0; i < originFileLines.length; i++) {
            var currOriginFileLine = originFileLines[i];
            if (typeof currentBlockName !== 'string') {
                var match = currOriginFileLine.match(startLineRegex);
                if (match && !ignoreLineRegex.test(currOriginFileLine)) {
                    var foundBlockName = match[1];
                    if (typeof foundBlockName === 'string') {
                        currentBlockName = foundBlockName;
                        currCodeBlocks[currentBlockName] = [currOriginFileLine];
                    }
                }
                else {
                    var singleLineMatch = currOriginFileLine.match(singleLineRegex);
                    if (singleLineMatch && !ignoreLineRegex.test(currOriginFileLine)) {
                        var foundBlockName = singleLineMatch[1];
                        currCodeBlocks[foundBlockName] = [currOriginFileLine];
                    }
                }
            }
            else {
                // Else we are inside a code block, search for closing tag
                var match = currOriginFileLine.match(endLineRegex);
                if (match && !ignoreLineRegex.test(currOriginFileLine)) {
                    var foundBlockName = match[1];
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
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "Missing closing lock for code block ".concat(currentBlockName, " in file ").concat(currOriginFile, ". Skipping file."));
            delete originCodeBlocks[currRelativeFilePath];
        }
        else {
            // If at least one present, check for corresponding file in target, warn if missing
            var originCodeBlockNames = Object.keys(originCodeBlocks[currRelativeFilePath]);
            if (originCodeBlockNames.length > 0) {
                var targetFilePath = "".concat(targetDirPath, "/").concat(currRelativeFilePath);
                if (fs_extra_1.default.pathExistsSync(targetFilePath)) {
                    // Create a merged lines array. Fill line by line.
                    var mergedFileLines = [];
                    // Split target file on newline
                    var targetFileLines = fs_extra_1.default.readFileSync(targetFilePath).toString().split('\n');
                    var currentBlockName_1 = undefined;
                    var oldBlockLines = [];
                    var replacedCodeBlocks_1 = [];
                    for (var i = 0; i < targetFileLines.length; i++) {
                        var currTargetFileLine = targetFileLines[i];
                        // Check for code blocks. Once hit, check if it exists in origin, warn if not.
                        if (typeof currentBlockName_1 !== 'string') {
                            var match = currTargetFileLine.match(startLineRegex);
                            if (match && !ignoreLineRegex.test(currTargetFileLine)) {
                                var foundBlockName = match[1];
                                if (typeof foundBlockName === 'string') {
                                    currentBlockName_1 = foundBlockName;
                                    oldBlockLines.push(currTargetFileLine);
                                }
                            }
                            else {
                                var singleLineMatch = currTargetFileLine.match(singleLineRegex);
                                if (singleLineMatch && !ignoreLineRegex.test(currTargetFileLine)) {
                                    var foundBlockName = singleLineMatch[1];
                                    // If exists in origin, use origin blocks.
                                    if (originCodeBlockNames.includes(foundBlockName)) {
                                        replacedCodeBlocks_1.push(foundBlockName);
                                        mergedFileLines.push.apply(mergedFileLines, currCodeBlocks[foundBlockName]);
                                    }
                                    else {
                                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, "Couldn't find single code block line ".concat(foundBlockName, " in origin file ").concat(currOriginFile, ". Please check if the code block line was removed."));
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
                            var match = currTargetFileLine.match(endLineRegex);
                            if (match && !ignoreLineRegex.test(currTargetFileLine)) {
                                var foundBlockName = match[1];
                                if (currentBlockName_1 === foundBlockName) {
                                    // If exists in origin, use origin blocks.
                                    if (originCodeBlockNames.includes(foundBlockName)) {
                                        replacedCodeBlocks_1.push(currentBlockName_1);
                                        mergedFileLines.push.apply(mergedFileLines, currCodeBlocks[currentBlockName_1]);
                                    }
                                    else {
                                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, "Couldn't find code block [".concat(currentBlockName_1, "] in origin file ").concat(currOriginFile, ". Please check if the code block was removed."));
                                        // If the block wasn't found in the origin, still carry it over.
                                        mergedFileLines.push.apply(mergedFileLines, oldBlockLines);
                                    }
                                    oldBlockLines = [];
                                    currentBlockName_1 = undefined;
                                }
                            }
                        }
                    }
                    // If no errors, write resulting file to target file, overwriting it.
                    if (typeof currentBlockName_1 === 'undefined') {
                        var missingBlockNames = originCodeBlockNames.filter(function (name) { return !replacedCodeBlocks_1.includes(name); });
                        if (replacedCodeBlocks_1.length !== originCodeBlockNames.length) {
                            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, "Expected code block(s) [".concat(missingBlockNames.join('], ['), "] were missing from the target file: ").concat(targetFilePath, ". If these were removed intentionally, ignore this warning."));
                        }
                        var previousFileContents = targetFileLines.join('\n');
                        var updatedFileContents = mergedFileLines.join('\n');
                        if (previousFileContents !== updatedFileContents) {
                            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Replacing code blocks: [".concat(replacedCodeBlocks_1.join('], ['), "] in ").concat(targetFilePath, "."));
                            fs_extra_1.default.writeFileSync(targetFilePath, updatedFileContents);
                        }
                    }
                    else {
                        (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "Missing closing lock for code block ".concat(currentBlockName_1, " in file ").concat(targetFilePath, ". Skipping file."));
                    }
                }
                else {
                    (0, Logging_1.logEvent)(events, Logging_1.LogEventType.warn, operation, "Corresponding code blocks file not found: ".concat(targetFilePath, " (code blocks [").concat(originCodeBlockNames.join('], ['), "])"));
                }
            }
        }
    });
    return events;
};
exports.replaceCodeBlocks = replaceCodeBlocks;
var updateJson = function (originFilePath, targetFilePath, rootUpdateOptions, renameFields, updateFields, deleteFields) {
    var events = [];
    var operation = 'updateJson';
    // Read origin JSON
    var originObj = jsonfile_1.default.readFileSync(originFilePath);
    // Read target JSON
    var originalTargetObj = jsonfile_1.default.readFileSync(targetFilePath);
    var targetObj = jsonfile_1.default.readFileSync(targetFilePath);
    if (typeof originObj === 'object' && typeof targetObj === 'object') {
        var updatedObject = (0, updateObject_1.updateObject)(originObj, targetObj, rootUpdateOptions, renameFields, updateFields, deleteFields);
        // Overwrite target file with updated, formatted JSON
        var jsonFormattingConfig = {
            type: 'space',
            size: 2,
        };
        try {
            var previousJsonBlob = JSON.stringify(originalTargetObj);
            var updatedJsonBlob = JSON.stringify(updatedObject);
            if (previousJsonBlob !== updatedJsonBlob) {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Updating JSON file: ".concat(targetFilePath));
                fs_extra_1.default.writeFileSync(targetFilePath, (0, json_format_1.default)(updatedObject, jsonFormattingConfig) + '\n');
            }
        }
        catch (err) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "Couldn't update JSON file: ".concat(targetFilePath, ". Error: ").concat(err));
        }
    }
    return events;
};
exports.updateJson = updateJson;
var updateYaml = function (originFilePath, targetFilePath, rootUpdateOptions, renameFields, updateFields, deleteFields) {
    var events = [];
    var operation = 'updateYaml';
    // Read origin YAML
    var originObj = read_yaml_1.default.sync(originFilePath);
    // Read target YAML
    var originalTargetObj = read_yaml_1.default.sync(targetFilePath);
    var targetObj = read_yaml_1.default.sync(targetFilePath);
    if (typeof originObj === 'object' && typeof targetObj === 'object') {
        var updatedObject = (0, updateObject_1.updateObject)(originObj, targetObj, rootUpdateOptions, renameFields, updateFields, deleteFields);
        // Overwrite target file with updated, formatted YAML
        try {
            var previousJsonBlob = JSON.stringify(originalTargetObj);
            var updatedJsonBlob = JSON.stringify(updatedObject);
            if (previousJsonBlob !== updatedJsonBlob) {
                (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Updating YAML file: ".concat(targetFilePath));
                write_yaml_file_1.default.sync(targetFilePath, updatedObject);
            }
        }
        catch (err) {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.error, operation, "Couldn't update YAML file: ".concat(targetFilePath, ". Error: ").concat(err));
        }
    }
    return events;
};
exports.updateYaml = updateYaml;
var writeLogFile = function (allEvents, targetDir, log) {
    var operation = 'writeLogFile';
    var events = [];
    // If log is truthy, or was unspecified (log by default)
    if (log || typeof log === 'undefined') {
        var logFileName = typeof log === 'string' ? log : DEFAULT_LOG_FILE_NAME;
        var logFilePath = "".concat(targetDir, "/").concat(logFileName);
        if (fs_extra_1.default.pathExistsSync(logFilePath)) {
            (0, exports.deleteFile)(logFilePath);
        }
        var jsonFormattingConfig = {
            type: 'space',
            size: 2,
        };
        try {
            (0, Logging_1.logEvent)(events, Logging_1.LogEventType.action, operation, "Saving log to: ".concat(logFilePath), { path: logFilePath });
            fs_extra_1.default.ensureFileSync(logFilePath);
            fs_extra_1.default.writeFileSync(logFilePath, (0, json_format_1.default)(__spreadArray(__spreadArray([], allEvents, true), events, true), jsonFormattingConfig) + '\n');
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
var getAllFiles = function (dirPath, arrayOfFiles) {
    if (arrayOfFiles === void 0) { arrayOfFiles = []; }
    var files = fs_extra_1.default.readdirSync(dirPath);
    files.forEach(function (file) {
        var fullFilePath = "".concat(dirPath, "/").concat(file);
        if (isDirectory(fullFilePath)) {
            arrayOfFiles = getAllFiles(fullFilePath, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(fullFilePath);
        }
    });
    return arrayOfFiles;
};
var filterExcludedFiles = function (dirPath, allFiles, excludedPaths, textFilesOnly) {
    return allFiles.filter(function (fileName) {
        var relativeFileName = fileName.substring(dirPath.length + 1);
        var excluded = !!excludedPaths.find(function (excludedPath) {
            return relativeFileName === excludedPath || relativeFileName.indexOf("".concat(excludedPath, "/")) === 0;
        });
        if (!excluded && textFilesOnly) {
            excluded = !isTextFile(fileName);
        }
        return !excluded;
    });
};
var isDirectory = function (file) {
    var _a;
    return !!((_a = fs_extra_1.default.statSync(file, { throwIfNoEntry: false })) === null || _a === void 0 ? void 0 : _a.isDirectory());
};
var isTextFile = function (file) {
    var fileIsText = !!(0, istextorbinary_1.isText)(file);
    if (!fileIsText) {
        var fileContents = fs_extra_1.default.readFileSync(file);
        fileIsText = !!(0, istextorbinary_1.isText)(null, fileContents);
    }
    return fileIsText;
};
var deleteFile = function (path) {
    // // console.log('=== deleteFile ===');
    try {
        // console.log('Deleting:', path, isDirectory(path) ? '(directory)' : '(file)');
        fs_extra_1.default.rmSync(path, { recursive: true, force: true });
    }
    catch (e) { }
};
exports.deleteFile = deleteFile;
