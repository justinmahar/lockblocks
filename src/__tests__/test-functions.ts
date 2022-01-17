import { compareSync } from 'dir-compare';
import fs from 'fs-extra';
import { lockblocks } from '../lockblocks';

const originProjectName = '1-origin';
const targetProjectName = '2-target';
const expectedProjectName = '3-expected';
const resultsProjectName = '4-results';

export const createTestProjectPath = (testFilesRoot: string, projectDirName: string): string => {
  return `./tests/${testFilesRoot}/${projectDirName}`;
};

export const executeLockBlocksTest = (testFilesRoot: string) => {
  const originDir = createTestProjectPath(testFilesRoot, originProjectName);
  const targetDir = createTestProjectPath(testFilesRoot, resultsProjectName);
  lockblocks(originDir, targetDir);
};

export const setup = (testFilesRootName: string): void => {
  const targetDir = createTestProjectPath(testFilesRootName, targetProjectName);
  const targetCopyDir = createTestProjectPath(testFilesRootName, resultsProjectName);
  const targetDirExists = fs.pathExistsSync(targetDir);
  if (targetDirExists) {
    try {
      fs.rmdirSync(targetCopyDir, { recursive: true, force: true } as any);
    } catch (e) {}
    fs.ensureDirSync(targetCopyDir);
    fs.copySync(targetDir, targetCopyDir);
  } else {
    console.error("Target dir doesn't exist:", targetDir);
  }
};

export const tearDown = (testFilesRoot: string): void => {
  //
};

export const verify = (testFilesRoot: string): boolean => {
  const resultsDir = createTestProjectPath(testFilesRoot, resultsProjectName);
  const expectedDir = createTestProjectPath(testFilesRoot, expectedProjectName);

  const resultsDirExists = fs.pathExistsSync(resultsDir);
  const expectedDirExists = fs.pathExistsSync(expectedDir);

  let same = false;
  if (resultsDirExists) {
    if (expectedDirExists) {
      const comparisonResults = compareSync(resultsDir, expectedDir, { compareContent: true });
      // console.log(comparisonResults);
      same = !!comparisonResults?.same;
      if (!same) {
        // Print the differences.
        const differences = comparisonResults.diffSet?.filter((value) => value.state !== 'equal');
        console.error(differences);
      }
    } else {
      console.error("Error verifying. Expected directory doesn't exist:", expectedDir);
    }
  } else {
    console.error("Error verifying. Results directory doesn't exist:", resultsDir);
  }

  return same;
};

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

const isDirectory = (file: string): boolean => {
  return !!fs.statSync(file, { throwIfNoEntry: false })?.isDirectory();
};
