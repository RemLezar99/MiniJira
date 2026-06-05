import type { Response } from "express";

export type DevLogLevel = "debug" | "info" | "warn" | "error";

export type DevLogEntry = {
  id: number;
  timestamp: string;
  level: DevLogLevel;
  source: "server" | "http" | "database";
  message: string;
  data?: unknown;
};

const MAX_LOGS = 500;

let nextId = 1;
const logs: DevLogEntry[] = [];
const clients = new Set<Response>();

export function addDevLog(entry: Omit<DevLogEntry, "id" | "timestamp">) {
  const fullEntry: DevLogEntry = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    ...entry
  };

  logs.push(fullEntry);

  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  const payload = `data: ${JSON.stringify(fullEntry)}\n\n`;

  for (const client of clients) {
    client.write(payload);
  }
}

export function getDevLogs() {
  return logs;
}

export function addDevLogClient(res: Response) {
  clients.add(res);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  for (const log of logs) {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  }

  res.write(`event: connected\ndata: {"status":"connected"}\n\n`);

  res.on("close", () => {
    clients.delete(res);
  });
}