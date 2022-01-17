"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = exports.LogEventType = void 0;
var LogEventType;
(function (LogEventType) {
    LogEventType["action"] = "action";
    LogEventType["info"] = "info";
    LogEventType["warn"] = "warn";
    LogEventType["error"] = "error";
})(LogEventType = exports.LogEventType || (exports.LogEventType = {}));
var logEvent = function (events, type, operation, message, data) {
    var event = __assign({ type: type, operation: operation, message: message }, data);
    events.push(event);
    return event;
};
exports.logEvent = logEvent;
