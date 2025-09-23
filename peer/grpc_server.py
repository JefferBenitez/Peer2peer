import os, json, pathlib, asyncio, traceback
import p2p_pb2, p2p_pb2_grpc
from google.protobuf import empty_pb2
from grpc import aio

CONFIG_PATH = os.environ.get("CONFIG_PATH", "/app/config.json")
with open(CONFIG_PATH) as f:
    CFG = json.load(f)

SHARED = pathlib.Path(CFG["shared_dir"])
SHARED.mkdir(parents=True, exist_ok=True)

class IndexSvc(p2p_pb2_grpc.IndexServicer):
    async def ListFiles(self, request, context):
        files = []
        for p in SHARED.iterdir():
            if p.is_file():
                files.append(p2p_pb2.FileInfo(
                    name=p.name, size=p.stat().st_size,
                    uri=f"http://{os.environ.get('PUBLIC_HOST','localhost')}:{CFG['port_rest']}/files/{p.name}"
                ))
        return p2p_pb2.FileList(files=files)

class DirectorySvc(p2p_pb2_grpc.DirectoryServicer):
    async def Locate(self, request, context):
        idx = IndexSvc()
        fl = await idx.ListFiles(empty_pb2.Empty(), context)
        for f in fl.files:
            if f.name == request.name:
                return p2p_pb2.LocateResult(found=True, locations=[f.uri], via="local-grpc")
        return p2p_pb2.LocateResult(found=False, locations=[], via="grpc")

class TransferSvc(p2p_pb2_grpc.TransferServicer):
    async def UploadDummy(self, request, context):
        (SHARED / request.name).write_text("dummy")
        return p2p_pb2.Ack(status="uploaded_dummy")

    async def DownloadDummy(self, request, context):
        if not (SHARED / request.name).exists():
            return p2p_pb2.Ack(status="not_found")
        return p2p_pb2.Ack(status="downloaded_dummy")

async def serve():
    try:
        server = aio.server()
        p2p_pb2_grpc.add_IndexServicer_to_server(IndexSvc(), server)
        p2p_pb2_grpc.add_DirectoryServicer_to_server(DirectorySvc(), server)
        p2p_pb2_grpc.add_TransferServicer_to_server(TransferSvc(), server)
        bind = f"[::]:{CFG['port_grpc']}"
        server.add_insecure_port(bind)
        print(f"[gRPC] binding on {bind}")
        await server.start()
        print(f"[gRPC] listening on {CFG['port_grpc']}")
        await server.wait_for_termination()
    except Exception as e:
        print("[gRPC] FATAL:", e)
        traceback.print_exc()
        raise

if __name__ == "__main__":
    asyncio.run(serve())
