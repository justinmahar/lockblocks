"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lockblocks_1 = require("./lockblocks");
const main = () => {
    // Get user args. Ignore first two (node path, script path)
    const userArgs = process.argv.slice(2);
    if (userArgs.length >= 2) {
        const originDir = userArgs[0].replace(/\/$/, '');
        const targetDir = userArgs[1].replace(/\/$/, '');
        const events = (0, lockblocks_1.lockblocks)(originDir, targetDir);
        const silent = userArgs.slice(2).includes('--silent');
        if (!silent) {
            const verbose = userArgs.slice(2).includes('--verbose');
            for (const currEvent of events) {
                const output = `${currEvent.type}: [${currEvent.operation}] ${currEvent.message}`;
                switch (currEvent.type) {
                    case 'warn':
                        console.warn(output);
                        break;
                    case 'error':
                        console.error(output);
                        break;
                    default:
                        if (verbose) {
                            console.log(output);
                        }
                }
            }
        }
    }
};
exports.default = main;
