"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lockblocks_1 = require("./lockblocks");
var main = function () {
    // Get user args. Ignore first two (node path, script path)
    var userArgs = process.argv.slice(2);
    if (userArgs.length >= 2) {
        var originDir = userArgs[0].replace(/\/$/, '');
        var targetDir = userArgs[1].replace(/\/$/, '');
        var events = (0, lockblocks_1.lockblocks)(originDir, targetDir);
        var silent = userArgs.slice(2).includes('--silent');
        if (!silent) {
            var verbose = userArgs.slice(2).includes('--verbose');
            for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
                var currEvent = events_1[_i];
                var output = "".concat(currEvent.type, ": [").concat(currEvent.operation, "] ").concat(currEvent.message);
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
