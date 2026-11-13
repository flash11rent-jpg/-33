import http from "node:http";

const PORT = Number(process.env.PORT || 10000);
const UPSTREAM = (process.env.UPSTREAM_API_URL || "https://tim-tim-api.onrender.com").replace(/\/+$/, "");
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Origin is not allowed" }));
    return;
  }

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = new URL(req.url || "/", "http://localhost").pathname;
  if (req.method === "GET" && (path === "/health" || path === "/ready")) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: true, service: "tim-tim-preview-catalog-proxy" }));
    return;
  }

  if (req.method === "GET" && path === "/api/catalog") {
    try {
      const upstream = await fetch(UPSTREAM + "/api/catalog", {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120"
      });
      res.end(body);
    } catch {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ error: "Каталог временно недоступен" }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Tim-Tim preview catalog proxy listening on", PORT);
});
