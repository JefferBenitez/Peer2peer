import fetch from "node-fetch";

export function buildLocator({ shareDir, friendsIndex = [] }) {
  return async function locateHandler(req, res) {
    const { filename } = req.body || {};
    if (!filename) return res.status(400).json({ error: "filename required" });

    const candidates = [];

    // local
    try {
      const localFiles = await (await import("fs")).promises.readdir(shareDir);
      if (localFiles.includes(filename)) candidates.push({ peer: "self", url: "local" });
    } catch {}

    // amigos
    await Promise.all(friendsIndex.map(async (base) => {
      try {
        const r = await fetch(`${base}/index`);
        const j = await r.json();
        if (j?.files?.some((f) => f.name === filename)) {
          candidates.push({ peer: base, url: `${base}/files/${encodeURIComponent(filename)}` });
        }
      } catch {}
    }));

    res.json({ filename, candidates });
  };
}
