import fs from "fs";

export function buildIndexer({ shareDir, selfBaseUrl }) {
  return async function indexHandler(_req, res) {
    try {
      const files = (await fs.promises.readdir(shareDir)).map((name) => ({
        name,
        uri: `${selfBaseUrl}/files/${encodeURIComponent(name)}`
      }));
      res.json({ files });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  };
}
