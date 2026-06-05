import { Router } from "express";
import { addDevLogClient, getDevLogs } from "../lib/devLogStore.js";

export const devLogRoutes = Router();

devLogRoutes.get("/", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Mini Jira Backend Logs</title>
  <style>
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      background: #111827;
      color: #e5e7eb;
    }

    header {
      position: sticky;
      top: 0;
      background: #020617;
      border-bottom: 1px solid #374151;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h1 {
      margin: 0;
      font-size: 16px;
    }

    button {
      background: #374151;
      color: #f9fafb;
      border: 1px solid #4b5563;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
    }

    button:hover {
      background: #4b5563;
    }

    #status {
      font-size: 12px;
      color: #9ca3af;
    }

    #logs {
      padding: 12px;
      white-space: pre-wrap;
    }

    .log {
      border-bottom: 1px solid #1f2937;
      padding: 8px 4px;
    }

    .meta {
      color: #9ca3af;
    }

    .debug { color: #93c5fd; }
    .info { color: #86efac; }
    .warn { color: #fde68a; }
    .error { color: #fca5a5; }

    .data {
      color: #d1d5db;
      margin-top: 4px;
      padding-left: 16px;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Mini Jira Backend Logs</h1>
      <div id="status">Connecting...</div>
    </div>
    <button id="clear">Clear view</button>
  </header>

  <main id="logs"></main>

  <script>
    const logsEl = document.getElementById("logs");
    const statusEl = document.getElementById("status");
    const clearButton = document.getElementById("clear");

    clearButton.addEventListener("click", () => {
      logsEl.innerHTML = "";
    });

    function renderLog(log) {
      const el = document.createElement("div");
      el.className = "log";

      const data = log.data
        ? '<div class="data">' + escapeHtml(JSON.stringify(log.data, null, 2)) + '</div>'
        : "";

      el.innerHTML =
        '<div>' +
          '<span class="meta">[' + escapeHtml(log.timestamp) + ']</span> ' +
          '<span class="' + escapeHtml(log.level) + '">' + escapeHtml(log.level.toUpperCase()) + '</span> ' +
          '<span class="meta">' + escapeHtml(log.source) + '</span> ' +
          escapeHtml(log.message) +
        '</div>' +
        data;

      logsEl.appendChild(el);
      window.scrollTo(0, document.body.scrollHeight);
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    const events = new EventSource("/dev/logs/stream");

    events.onopen = () => {
      statusEl.textContent = "Connected";
    };

    events.onmessage = (event) => {
      renderLog(JSON.parse(event.data));
    };

    events.onerror = () => {
      statusEl.textContent = "Disconnected. Reconnecting...";
    };
  </script>
</body>
</html>`);
});

devLogRoutes.get("/json", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getDevLogs());
});

devLogRoutes.get("/stream", (_req, res) => {
  addDevLogClient(res);
});