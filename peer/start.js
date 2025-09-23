import fs from "fs";
import { startGrpcServer } from "../services/grpc/server.js";
import { startRestServer } from "../services/rest/server.js";

function loadConfig() {
  const cfgPath = process.env.CONFIG_PATH || "peer/config/peer1.json";
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  return { ...cfg, baseUrl: `http://localhost:${cfg.rest_port}` };
}

const cfg = loadConfig();

startRestServer({
  host: cfg.listen_ip || "127.0.0.1",
  restPort: cfg.rest_port,
  shareDir: cfg.share_dir,
  baseUrl: cfg.baseUrl,
  friendsIndex: cfg.friends_index || []
});

startGrpcServer({
  host: cfg.listen_ip || "127.0.0.1",
  port: cfg.grpc_port
});
