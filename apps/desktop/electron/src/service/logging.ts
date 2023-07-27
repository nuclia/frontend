let LOGS: any[] = [];

export function initLog() {
  const _console = globalThis.console;
  globalThis.console = {
    ..._console,
    log: (...args: any[]) => {
      LOGS.push(args);
      _console.log(...args);
    },
    error: (...args: any[]) => {
      LOGS.push(args);
      _console.error(...args);
    },
  };
}

export function getServerLogs(): string[] {
  const logs = LOGS.map((log) => `${log}`);
  LOGS = [];
  return logs;
}
