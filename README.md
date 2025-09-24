# Peer2Peer – REST + gRPC (Localhost)

Proyecto académico de red Peer-to-Peer en localhost que expone:

API REST para salud, índice de archivos y localización entre peers.

API gRPC para transferencia simulada (ECO/DUMMY):

Upload (ECO): recibe chunks y devuelve conteo de bytes.

Download (DUMMY): emite chunks ficticios de un “archivo”.

Diseñado para ejecutarse en Windows/VS Code, con tres peers concurrentes.

Objetivos

Ejecutar múltiples nodos en la misma máquina.

Separar microservicios REST y gRPC en cada nodo.

Demostrar índice, localización y transferencia simulada.

Entregar evidencias reproducibles con comandos simples.

# Arquitectura

Cada peer levanta 2 servidores:

REST (Express)

GET /health → estado.

GET /index → lista archivos del directorio compartido.

POST /locate { filename } → busca localmente y consulta a los amigos.

gRPC (@grpc/grpc-js)

Upload(stream Chunk) -> Ack (ECO: suma bytes recibidos)

Download(FileReq) -> stream Chunk (DUMMY: chunks simulados)

La configuración por peer (puertos, rutas, amigos) vive en peer/config/*.json.


Instalación
npm install

Configuración de peers

Archivos en peer/config/ (ejemplo para peer1):

{
  "listen_ip": "127.0.0.1",
  "rest_port": 8081,
  "grpc_port": 50051,
  "share_dir": "peer/data/peer1",
  "friend_primary": "http://localhost:8082",
  "friend_backup": "http://localhost:8083",
  "friends_index": ["http://localhost:8082", "http://localhost:8083"]
}


Ejecución

Abre tres terminales en VS Code:

npm run peer1   # REST 8081, gRPC 50051
npm run peer2   # REST 8082, gRPC 50052
npm run peer3   # REST 8083, gRPC 50053


Crea archivos de prueba:

# Windows (PowerShell)
ni .\peer\data\peer1\hola1.txt -ItemType File;  "peer1" | Out-File .\peer\data\peer1\hola1.txt -Encoding utf8
ni .\peer\data\peer2\hola2.txt -ItemType File;  "peer2" | Out-File .\peer\data\peer2\hola2.txt -Encoding utf8
ni .\peer\data\peer3\hola3.txt -ItemType File;  "peer3" | Out-File .\peer\data\peer3\hola3.txt -Encoding utf8

Pruebas REST

Health

curl http://localhost:8081/health


Index por peer

curl http://localhost:8081/index
curl http://localhost:8082/index
curl http://localhost:8083/index


Locate (desde peer1 buscando un archivo en peer2)

curl -H "Content-Type: application/json" \
     -d '{"filename":"hola2.txt"}' \
     http://localhost:8081/locate


Salida esperada:

{
  "filename": "hola2.txt",
  "candidates": [
    { "peer": "http://localhost:8082", "url": "http://localhost:8082/files/hola2.txt" }
  ]
}


Puedes abrir el url en el navegador para mostrar que /files sirve el archivo.
