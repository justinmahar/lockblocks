"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = exports.LogEventType = void 0;
var LogEventType;
(function (LogEventType) {
    LogEventType["action"] = "action";
    LogEventType["info"] = "info";
    LogEventType["warn"] = "warn";
    LogEventType["error"] = "error";
})(LogEventType = exports.LogEventType || (exports.LogEventType = {}));
const logEvent = (events, type, operation, message, data) => {
    const event = Object.assign({ type,
        operation,
        message }, data);
    events.push(event);
    return event;
};
exports.logEvent = logEvent;
