import fs from 'fs-extra';
import { isText } from 'istextorbinary';
import jsonFormat from 'json-format';
// import readline from 'readline';
// import replace from 'replace-in-file';
import jsonfile from 'jsonfile';
import readYaml from 'read-yaml';
import writeYamlFile from 'write-yaml-file';
import { FieldUpdate, FieldUpdateOptions, LockblocksSettings, OriginTarget, Reassignment } from './LockblocksSettings';
import { logEvent, LogEvent, LogEventType } from './Logging';
import { updateObject } from './updateObject';

const DEFAULT_LOG_FILE_NAME = 'lockblocks.log';

const startLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\]/;
const endLineRegex = /\[\/\s*lock:([\w\d\-_]+)\s*\]/;
const singleLineRegex = /\[\s*lock:([\w\d\-_]+)\s*\/\]/;
const ignoreLineRegex = /\[\s*lock-ignore\s*\/\]/;
const replaceAllLineRegex = /\[\s*lock-all\s*\/\]/;
const renameLineRegex = /\[\s*lock-rename:(.+?)\s*\/\]/;

export const lockblocks = (originDir: string, targetDir: string): LogEvent[] => {
  const settingsYamlPath = `${originDir}/lockblocks.yml`;
  const originDirExists = fs.pathExistsSync(originDir);
  const targetDirExists = fs.pathExistsSync(targetDir);
  const settingExists = fs.pathExistsSync(settingsYamlPath);
  const events: LogEvent[] = [];
  if (!originDirExists) {
    // console.error('Error: Origin directory does not exist:', originDir);
  } else if (!targetDirExists) {
    // console.error('Error: Target directory does not exist:', targetDir);
  } else if (!settingExists) {
    // console.error('Error: lockblocks.yml does not exist in the target directory:', settingsYamlPath);
  } else {
    const settings: LockblocksSettings = readYaml.sync(settingsYamlPath);

    // For operations that scan all files, exclude these paths
    const excludedScanPaths = settings.excludePaths || [];

    if (excludedScanPaths.length > 0) {
      logEvent(events, LogEventType.info, 'lockblocks', `Excluding paths: ${excludedScanPaths.join(', ')}`);
    }

    // Rename files
    const renameFilesEvents = renameFiles(originDir, targetDir, settings.renameFiles || [], excludedScanPaths);
    events.push(...renameFilesEvents);

    // Replace files
    const replaceFilesEvents = replaceFiles(originDir, targetDir, settings.replaceFiles || [], excludedScanPaths);
    events.push(...replaceFilesEvents);

    // Fill files
    const fillFilesEvents = fillFiles(originDir, targetDir, settings.fillFiles || []);
    events.push(...fillFilesEvents);

    // Delete files
    const deleteFilesEvents = deleteFiles(targetDir, settings.deleteFiles || []);
    events.push(...deleteFilesEvents);

    // Replace code blocks
    const replaceCodeBlocksEvents = replaceCodeBlocks(originDir, targetDir, excludedScanPaths);
    events.push(...replaceCodeBlocksEvents);

    // Update JSON
    settings.updateJson?.forEach((itemConfig) => {
      const originPath = `${originDir}/${itemConfig.path}`;
      const targetPath = `${targetDir}/${itemConfig.path}`;
      const updateJsonEvents = updateJson(
        originPath,
        targetPath,
        itemConfig.root,
        itemConfig.renameFields || [],
        itemConfig.updateFields || [],
        itemConfig.deleteFields || [],
      );
      events.push(...updateJsonEvents);
    });

    // Update YAML
    settings.updateYaml?.forEach((itemConfig) => {
      const originPath = `${originDir}/${itemConfig.path}`;
      const targetPath = `${targetDir}/${itemConfig.path}`;
      const updateYamlEvents = updateYaml(
        originPath,
        targetPath,
        itemConfig.root,
        itemConfig.renameFields || [],
        itemConfig.updateFields || [],
        itemConfig.deleteFields || [],
      );
      events.push(...updateYamlEvents);
    });

    // Write log file
    const writeLogFileEvents = writeLogFile(events, targetDir, settings.log);
    events.push(...writeLogFileEvents);
  }

  return events;
};

export const renameFiles = (
  originDirPath: string,
  targetDirPath: string,
  renameFiles: Reassignment[],
  excludedScanPaths: string[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'renameFiles';

  // Scan all source files and collect renamed file names (build on existing map)
  const filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
  filesToScan.forEach((currFile) => {
    const fileLines = fs.readFileSync(currFile).toString().split('\n');
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
    if (fs.pathExistsSync(fromFile)) {
      if (!fs.pathExistsSync(toFile)) {
        if (isDirectory(fromFile)) {
          logEvent(events, LogEventType.action, operation, `Renaming: ${fromFile} -> ${toFile}`, {
            fileType: 'directory',
          });
          fs.ensureDirSync(toFile);
          fs.moveSync(fromFile, toFile, { overwrite: true });
        } else {
          logEvent(events, LogEventType.action, operation, `Renaming: ${fromFile} -> ${toFile}`, { fileType: 'file' });
          fs.ensureFileSync(toFile);
          fs.moveSync(fromFile, toFile, { overwrite: true });
        }
      } else {
        logEvent(
          events,
          LogEventType.info,
          operation,
          `Skipping renaming. File already exists: ${fromFile} -> ${toFile}`,
        );
      }
    }
  });

  return events;
};

export const replaceFiles = (
  originDirPath: string,
  targetDirPath: string,
  items: (string | OriginTarget)[],
  excludedScanPaths: string[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'replaceFiles';

  // First, replace all explicitly defined files
  items.forEach((itemConfig) => {
    const originPath = `${originDirPath}/${
      typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target
    }`;
    const targetPath = `${targetDirPath}/${
      typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin
    }`;
    const originFileExists = fs.pathExistsSync(originPath);
    if (originFileExists) {
      let destinationIsDir = false;
      try {
        destinationIsDir = isDirectory(targetPath);
      } catch (e) {}

      if (!destinationIsDir) {
        logEvent(events, LogEventType.action, operation, `Replacing: ${originPath} -> ${targetPath}`, {
          fileType: 'file',
        });
        // Replace file
        fs.ensureFileSync(targetPath);
        fs.copySync(originPath, targetPath, { overwrite: true });
      } else {
        // Replace directory
        const originDirExists = fs.pathExistsSync(originPath);
        if (originDirExists) {
          logEvent(events, LogEventType.action, operation, `Replacing: ${originPath} -> ${targetPath}`, {
            fileType: 'directory',
          });
          // Delete target dir or do nothing if doesn't exist
          const targetDirExists = fs.pathExistsSync(targetPath);
          if (targetDirExists) {
            fs.rmSync(targetPath, { recursive: true, force: true });
          }
          // Recursively copy origin dir to target dir
          fs.copySync(originPath, targetPath);
        } else {
          logEvent(events, LogEventType.warn, operation, `Cannot replace. Origin dir does not exist: ${originPath}`);
        }
      }
    }
  });

  // Now, filter and scan all files for the lock-all tag
  const filesToScan = filterExcludedFiles(targetDirPath, getAllFiles(targetDirPath), excludedScanPaths, true);
  filesToScan.forEach((currFile) => {
    const fileLines = fs.readFileSync(currFile).toString().split('\n');
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
      const fileLines = fs.readFileSync(currFile).toString().split('\n');
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
        if (fs.pathExistsSync(originFilePath) && !isDirectory(originFilePath)) {
          // Only replace the file if it changed in any way
          if (fs.readFileSync(currFile).toString() !== fs.readFileSync(originFilePath).toString()) {
            // console.log('Changed detected. Replacing', currFile, 'with', originFilePath);
            fs.copySync(originFilePath, currFile, { overwrite: true });
          } else {
            // console.log('No changed detected for: ', currFile);
          }
        }
      }
    }
  });

  return events;
};

/**
 * Copy files only if not already present.
 */
export const fillFiles = (
  originDirPath: string,
  targetDirPath: string,
  items: (string | OriginTarget)[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'fillFiles';

  items.forEach((itemConfig) => {
    const originPath = `${originDirPath}/${
      typeof itemConfig === 'string' ? itemConfig : itemConfig.origin || itemConfig.target
    }`;
    const targetPath = `${targetDirPath}/${
      typeof itemConfig === 'string' ? itemConfig : itemConfig.target || itemConfig.origin
    }`;
    if (fs.pathExistsSync(originPath)) {
      if (isDirectory(originPath)) {
        if (!fs.pathExistsSync(targetPath)) {
          fs.ensureDirSync(targetPath);
        }
        if (isDirectory(targetPath)) {
          // Get all files in the origin directory, and copy to the target dir if non-existent there
          const originFiles = getAllFiles(originPath);
          originFiles.forEach((currOriginFile) => {
            const targetFilePath = `${targetPath}/${currOriginFile.substring(originPath.length + 1)}`;
            if (!fs.pathExistsSync(targetFilePath)) {
              try {
                logEvent(events, LogEventType.action, operation, `Filling in missing directory: ${targetFilePath}`, {
                  fileType: 'directory',
                });
                fs.copySync(currOriginFile, targetFilePath, { overwrite: false });
              } catch (e) {
                logEvent(events, LogEventType.error, operation, `${e}`);
              }
            }
          });
        } else {
          logEvent(
            events,
            LogEventType.error,
            operation,
            `Target directory was a file, not a directory. Tried to fill from: ${originPath} -> ${targetPath}`,
          );
        }
      } else {
        if (!fs.pathExistsSync(targetPath)) {
          logEvent(events, LogEventType.action, operation, `Filling in missing file: ${targetPath}`, {
            fileType: 'file',
          });
          fs.ensureFileSync(targetPath);
          fs.copySync(originPath, targetPath, { overwrite: true });
        }
      }
    }
  });

  return events;
};

export const deleteFiles = (targetDir: string, deleteFiles: string[]): LogEvent[] => {
  const operation = 'deleteFiles';
  const events: LogEvent[] = [];
  deleteFiles?.forEach((path) => {
    const deletePath = `${targetDir}/${path}`;
    if (fs.pathExistsSync(deletePath)) {
      const isDir = isDirectory(deletePath);
      logEvent(events, LogEventType.action, operation, `Deleting ${isDir ? 'directory' : 'file'}: ${deletePath}`, {
        fileType: isDir ? 'directory' : 'file',
      });
      deleteFile(deletePath);
    }
  });
  return events;
};

export const replaceCodeBlocks = (
  originDirPath: string,
  targetDirPath: string,
  excludedScanPaths: string[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'replaceCodeBlocks';

  // Scan all non-excluded files in origin dir
  const filesToScan = filterExcludedFiles(originDirPath, getAllFiles(originDirPath), excludedScanPaths, true);
  const originCodeBlocks: Record<string, Record<string, string[]>> = {};
  filesToScan.forEach((currOriginFile) => {
    const currRelativeFilePath = currOriginFile.substring(originDirPath.length + 1);
    const currCodeBlocks: Record<string, string[]> = {};
    originCodeBlocks[currRelativeFilePath] = currCodeBlocks;
    // For each file, read file, split on newline
    const originFileLines = fs.readFileSync(currOriginFile).toString().split('\n');
    let currentBlockName: string | undefined = undefined;
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
        } else {
          const singleLineMatch = currOriginFileLine.match(singleLineRegex);
          if (singleLineMatch && !ignoreLineRegex.test(currOriginFileLine)) {
            const foundBlockName = singleLineMatch[1];
            currCodeBlocks[foundBlockName] = [currOriginFileLine];
          }
        }
      } else {
        // Else we are inside a code block, search for closing tag
        const match = currOriginFileLine.match(endLineRegex);
        if (match && !ignoreLineRegex.test(currOriginFileLine)) {
          const foundBlockName = match[1];
          if (currentBlockName === foundBlockName) {
            currCodeBlocks[currentBlockName].push(currOriginFileLine);
            currentBlockName = undefined;
          }
        } else {
          currCodeBlocks[currentBlockName].push(currOriginFileLine);
        }
      }
    }
    if (typeof currentBlockName === 'string') {
      logEvent(
        events,
        LogEventType.error,
        operation,
        `Missing closing lock for code block ${currentBlockName} in file ${currOriginFile}. Skipping file.`,
      );
      delete originCodeBlocks[currRelativeFilePath];
    } else {
      // If at least one present, check for corresponding file in target, warn if missing
      const originCodeBlockNames = Object.keys(originCodeBlocks[currRelativeFilePath]);
      if (originCodeBlockNames.length > 0) {
        const targetFilePath = `${targetDirPath}/${currRelativeFilePath}`;
        if (fs.pathExistsSync(targetFilePath)) {
          // Create a merged lines array. Fill line by line.
          const mergedFileLines: string[] = [];
          // Split target file on newline
          const targetFileLines = fs.readFileSync(targetFilePath).toString().split('\n');
          let currentBlockName: string | undefined = undefined;
          let oldBlockLines: string[] = [];
          const replacedCodeBlocks: string[] = [];
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
              } else {
                const singleLineMatch = currTargetFileLine.match(singleLineRegex);
                if (singleLineMatch && !ignoreLineRegex.test(currTargetFileLine)) {
                  const foundBlockName = singleLineMatch[1];
                  // If exists in origin, use origin blocks.
                  if (originCodeBlockNames.includes(foundBlockName)) {
                    replacedCodeBlocks.push(foundBlockName);
                    mergedFileLines.push(...currCodeBlocks[foundBlockName]);
                  } else {
                    logEvent(
                      events,
                      LogEventType.warn,
                      operation,
                      `Couldn't find single code block line ${foundBlockName} in origin file ${currOriginFile}. Please check if the code block line was removed.`,
                    );
                    // If the block wasn't found in the origin, still carry it over.
                    mergedFileLines.push(currTargetFileLine);
                  }
                } else {
                  mergedFileLines.push(currTargetFileLine);
                }
              }
            } else {
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
                  } else {
                    logEvent(
                      events,
                      LogEventType.warn,
                      operation,
                      `Couldn't find code block [${currentBlockName}] in origin file ${currOriginFile}. Please check if the code block was removed.`,
                    );
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
              logEvent(
                events,
                LogEventType.warn,
                operation,
                `Expected code block(s) [${missingBlockNames.join(
                  '], [',
                )}] were missing from the target file: ${targetFilePath}. If these were removed intentionally, ignore this warning.`,
              );
            }

            const previousFileContents = targetFileLines.join('\n');
            const updatedFileContents = mergedFileLines.join('\n');
            if (previousFileContents !== updatedFileContents) {
              logEvent(
                events,
                LogEventType.action,
                operation,
                `Replacing code blocks: [${replacedCodeBlocks.join('], [')}] in ${targetFilePath}.`,
              );
              fs.writeFileSync(targetFilePath, updatedFileContents);
            }
          } else {
            logEvent(
              events,
              LogEventType.error,
              operation,
              `Missing closing lock for code block ${currentBlockName} in file ${targetFilePath}. Skipping file.`,
            );
          }
        } else {
          logEvent(
            events,
            LogEventType.warn,
            operation,
            `Corresponding code blocks file not found: ${targetFilePath} (code blocks [${originCodeBlockNames.join(
              '], [',
            )}])`,
          );
        }
      }
    }
  });

  return events;
};

export const updateJson = (
  originFilePath: string,
  targetFilePath: string,
  rootUpdateOptions: FieldUpdateOptions,
  renameFields: Reassignment[],
  updateFields: FieldUpdate[],
  deleteFields: string[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'updateJson';

  // Read origin JSON
  const originObj = jsonfile.readFileSync(originFilePath);
  // Read target JSON
  const originalTargetObj = jsonfile.readFileSync(targetFilePath);
  const targetObj = jsonfile.readFileSync(targetFilePath);
  if (typeof originObj === 'object' && typeof targetObj === 'object') {
    const updatedObject = updateObject(
      originObj,
      targetObj,
      rootUpdateOptions,
      renameFields,
      updateFields,
      deleteFields,
    );
    // Overwrite target file with updated, formatted JSON
    const jsonFormattingConfig = {
      type: 'space',
      size: 2,
    };
    try {
      const previousJsonBlob = JSON.stringify(originalTargetObj);
      const updatedJsonBlob = JSON.stringify(updatedObject);
      if (previousJsonBlob !== updatedJsonBlob) {
        logEvent(events, LogEventType.action, operation, `Updating JSON file: ${targetFilePath}`);
        fs.writeFileSync(targetFilePath, jsonFormat(updatedObject, jsonFormattingConfig) + '\n');
      }
    } catch (err) {
      logEvent(events, LogEventType.error, operation, `Couldn't update JSON file: ${targetFilePath}. Error: ${err}`);
    }
  }

  return events;
};

export const updateYaml = (
  originFilePath: string,
  targetFilePath: string,
  rootUpdateOptions: FieldUpdateOptions,
  renameFields: Reassignment[],
  updateFields: FieldUpdate[],
  deleteFields: string[],
): LogEvent[] => {
  const events: LogEvent[] = [];
  const operation = 'updateYaml';

  // Read origin YAML
  const originObj = readYaml.sync(originFilePath);
  // Read target YAML
  const originalTargetObj = readYaml.sync(targetFilePath);
  const targetObj = readYaml.sync(targetFilePath);
  if (typeof originObj === 'object' && typeof targetObj === 'object') {
    const updatedObject = updateObject(
      originObj,
      targetObj,
      rootUpdateOptions,
      renameFields,
      updateFields,
      deleteFields,
    );
    // Overwrite target file with updated, formatted YAML
    try {
      const previousJsonBlob = JSON.stringify(originalTargetObj);
      const updatedJsonBlob = JSON.stringify(updatedObject);
      if (previousJsonBlob !== updatedJsonBlob) {
        logEvent(events, LogEventType.action, operation, `Updating YAML file: ${targetFilePath}`);
        writeYamlFile.sync(targetFilePath, updatedObject);
      }
    } catch (err) {
      logEvent(events, LogEventType.error, operation, `Couldn't update YAML file: ${targetFilePath}. Error: ${err}`);
    }
  }

  return events;
};

export const writeLogFile = (
  allEvents: LogEvent[],
  targetDir: string,
  log: string | boolean | undefined,
): LogEvent[] => {
  const operation = 'writeLogFile';
  const events: LogEvent[] = [];

  if (log) {
    const logFileName = typeof log === 'string' ? log : DEFAULT_LOG_FILE_NAME;
    const logFilePath = `${targetDir}/${logFileName}`;
    if (fs.pathExistsSync(logFilePath)) {
      deleteFile(logFilePath);
    }
    const jsonFormattingConfig = {
      type: 'space',
      size: 2,
    };
    try {
      logEvent(events, LogEventType.action, operation, `Saving log to: ${logFilePath}`, { path: logFilePath });
      fs.writeFileSync(logFilePath, jsonFormat([...allEvents, ...events], jsonFormattingConfig) + '\n');
    } catch (err) {
      console.error(err);
    }
  }

  return events;
};

// === === === === === === === === === === === === === === === === ===
// --- Utilities ---

const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullFilePath = `${dirPath}/${file}`;
    if (isDirectory(fullFilePath)) {
      arrayOfFiles = getAllFiles(fullFilePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullFilePath);
    }
  });

  return arrayOfFiles;
};

const filterExcludedFiles = (
  dirPath: string,
  allFiles: string[],
  excludedPaths: string[],
  textFilesOnly: boolean,
): string[] => {
  return allFiles.filter((fileName) => {
    const relativeFileName = fileName.substring(dirPath.length + 1);
    let excluded = !!excludedPaths.find((excludedPath) => {
      return relativeFileName.indexOf(excludedPath) === 0;
    });
    if (!excluded && textFilesOnly) {
      excluded = !isTextFile(fileName);
    }
    return !excluded;
  });
};

const isDirectory = (file: string): boolean => {
  return !!fs.statSync(file, { throwIfNoEntry: false })?.isDirectory();
};

const isTextFile = (file: string): boolean => {
  let fileIsText = !!isText(file);
  if (!fileIsText) {
    const fileContents = fs.readFileSync(file);
    fileIsText = !!isText(null, fileContents);
  }
  return fileIsText;
};

export const deleteFile = (path: string) => {
  // // console.log('=== deleteFile ===');
  try {
    // console.log('Deleting:', path, isDirectory(path) ? '(directory)' : '(file)');
    fs.rmSync(path, { recursive: true, force: true });
  } catch (e) {}
};
