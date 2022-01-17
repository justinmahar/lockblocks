export type LogEvent = {
  type: LogEventType;
  operation: string;
  message: string;
} & Record<string, any>;

export enum LogEventType {
  action = 'action',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export const logEvent = (
  events: LogEvent[],
  type: LogEventType,
  operation: string,
  message: string,
  data?: Record<string, any>,
): LogEvent => {
  const event = {
    type,
    operation,
    message,
    ...data,
  };
  events.push(event);
  return event;
};
