console.log("server.ts loaded");

import { app } from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { addDevLog } from "./lib/devLogStore.js";

console.log("about to call app.listen", env.PORT);

app.listen(env.PORT, () => {
  const message = `Server running on http://localhost:${env.PORT}`;

  logger.info(message);

  addDevLog({
    level: "info",
    source: "server",
    message
  });

  console.log(message);
});