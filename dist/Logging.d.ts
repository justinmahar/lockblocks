export type LogEvent = {
    type: LogEventType;
    operation: string;
    message: string;
} & Record<string, any>;
export declare enum LogEventType {
    action = "action",
    info = "info",
    warn = "warn",
    error = "error"
}
export declare const logEvent: (events: LogEvent[], type: LogEventType, operation: string, message: string, data?: Record<string, any>) => LogEvent;
