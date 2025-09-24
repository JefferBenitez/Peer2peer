
import express from "express";
import bodyParser from "body-parser";
import { buildIndexer } from "./indexer.js";
import { buildLocator } from "./locator.js";

export function startRestServer({ host, restPort, shareDir, baseUrl, friendsIndex }) {
  const app = express();
  app.use(bodyParser.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/index",  buildIndexer({ shareDir, selfBaseUrl: baseUrl }));
  app.post("/locate", buildLocator({ shareDir, friendsIndex }));
  app.use("/files",  express.static(shareDir));

  return app.listen(restPort, host, () =>
    console.log(`[REST] listening on ${baseUrl}`)
  );
}
