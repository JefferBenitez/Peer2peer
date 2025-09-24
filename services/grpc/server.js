// Servidor gRPC del peer: implementa Upload (ECO: cuenta bytes) y Download (DUMMY: emite chunks simulados).


import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "./transfer.proto");

export function startGrpcServer({ host, port }) {
  const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true });
  const grpcObj = grpc.loadPackageDefinition(packageDef);
  const svc = grpcObj.transfer.Transfer;
  const server = new grpc.Server();

  function Upload(call, callback) {
    let total = 0;
    call.on("data", (chunk) => { if (chunk?.data) total += chunk.data.length; });
    call.on("end", () => callback(null, { ok: true, msg: "ECO upload ok", bytes_received: total }));
  }

  function Download(call) {
    const { name, repeat = 3 } = call.request || {};
    const payload = Buffer.from(`DUMMY:${name ?? "file"}`);
    for (let i = 0; i < repeat; i++) call.write({ data: payload });
    call.end();
  }

  server.addService(svc.service, { Upload, Download });
  const bindAddr = `${host}:${port}`;
  server.bindAsync(bindAddr, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    console.log(`[gRPC] listening on ${bindAddr}`);
    server.start();
  });
  return server;
}
