import { executeLockBlocksTest, setup, tearDown, verify } from './test-functions';
import fs from 'fs-extra';

const allTestsDir = 'tests';
const testDirs = fs.readdirSync(allTestsDir);

describe(`LockBlocks ${allTestsDir}`, () => {
  for (let i = 0; i < testDirs.length; i++) {
    const testDir = testDirs[i];
    const contents = fs.readdirSync(`${allTestsDir}/${testDir}`);
    if (contents.length > 0) {
      test(testDir, () => {
        const testFilesRoot = testDir;
        // Set up test target folder
        setup(testFilesRoot);
        // Execute LockBlocks test
        executeLockBlocksTest(testFilesRoot);
        // Verify results
        const verification = verify(testFilesRoot);
        if (!verification) {
          throw new Error(`Test "${testDir}" failed verification. Expected results are not the same as test results.`);
        }
        // Tear down the test files
        tearDown(testFilesRoot);
      });
    }
    // console.warn('Empty test directory:', testDir);
  }
});
