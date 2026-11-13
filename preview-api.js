import http from "node:http";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const PORT = Number(process.env.PORT || 10000);
const UPSTREAM = (process.env.UPSTREAM_API_URL || "https://tim-tim-api.onrender.com").replace(/\/+$/, "");
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
const ADMIN_KEY = process.env.PREVIEW_ADMIN_KEY || "";
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 8000
}) : null;

const sha256 = value => createHash("sha256").update(value).digest("hex");
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
};
const json = (res, status, body, extra = {}) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra });
  res.end(JSON.stringify(body));
};
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 64 * 1024) throw new Error("BODY_TOO_LARGE");
  }
  return raw ? JSON.parse(raw) : {};
}
const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const validStatuses = ["Новый","Подтверждён","Собирается","Готов","В пути","Доставлен","Отменён"];
const validRequestStatuses = ["Новая заявка","Проверяется","Согласована","Покупка выполняется","Выполнена","Отменена"];
async function getCatalog() {
  const r = await fetch(UPSTREAM + "/api/catalog", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("CATALOG_UNAVAILABLE");
  return r.json();
}
async function initDb() {
  if (!pool) return;
  const { readFile } = await import("node:fs/promises");
  const schema = await readFile(new URL("./preview-orders-schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) return json(res, 403, { error: "Origin is not allowed" });
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Order-Token, X-Admin-Key");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") return json(res, 200, { ok: true, service: "tim-tim-preview-api" });
  if (req.method === "GET" && path === "/ready") {
    if (!pool) return json(res, 503, { ok: false, database: "not_configured" });
    try { await pool.query("SELECT 1"); return json(res, 200, { ok: true, database: "connected" }); }
    catch { return json(res, 503, { ok: false, database: "unavailable" }); }
  }

  if (req.method === "GET" && path === "/api/catalog") {
    try {
      const upstream = await fetch(UPSTREAM + "/api/catalog", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
      const body = await upstream.text();
      res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8", "Cache-Control": "public, max-age=30, stale-while-revalidate=120" });
      return res.end(body);
    } catch { return json(res, 502, { error: "Каталог временно недоступен" }); }
  }

  if (path.startsWith("/api/") && !pool) return json(res, 503, { error: "Хранение заказов ещё не подключено" });

  if (req.method === "POST" && path === "/api/orders") {
    try {
      const b = await readBody(req);
      if (!Number.isInteger(b.shopId) || b.shopId < 1 || !Array.isArray(b.items) || !b.items.length || b.items.length > 50 ||
          !str(b.phone, 7, 30) || !str(b.address, 5, 300) || (b.comment !== undefined && !str(b.comment, 0, 1000))) {
        return json(res, 400, { error: "Проверьте данные заказа" });
      }
      const quantities = new Map();
      for (const item of b.items) {
        if (!Number.isInteger(item.productId) || item.productId < 1 || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 50)
          return json(res, 400, { error: "Проверьте состав корзины" });
        quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.qty);
      }
      if ([...quantities.values()].some(q => q > 50)) return json(res, 400, { error: "Слишком большое количество товара" });
      const catalog = await getCatalog();
      const shop = (catalog.shops || []).find(x => Number(x.id) === b.shopId && x.is_active !== false);
      if (!shop) return json(res, 400, { error: "Магазин временно недоступен" });
      const products = catalog.products || [];
      const snapshot = [...quantities.entries()].map(([id, qty]) => {
        const p = products.find(x => Number(x.id) === id && Number(x.shop_id ?? x.shopId) === b.shopId && x.is_active !== false);
        if (!p) return null;
        const price = Number(p.price_rub ?? p.price);
        if (!Number.isSafeInteger(price) || price < 0) return null;
        return { productId: id, name: p.name, unit: p.unit || "шт.", price, qty, lineTotal: price * qty };
      });
      if (snapshot.some(x => !x)) return json(res, 400, { error: "Один или несколько товаров недоступны. Обновите корзину." });
      const total = snapshot.reduce((sum, x) => sum + x.lineTotal, 0);
      if (total < 700) return json(res, 400, { error: "Минимальная сумма товаров — 700 ₽" });
      const token = randomBytes(32).toString("base64url");
      const inserted = await pool.query(
        `INSERT INTO preview_orders (tracking_token_hash, shop_id, shop_name, items, items_total_rub, total_rub, customer_phone, delivery_address, customer_comment)
         VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8)
         RETURNING id, order_number, status, total_rub, created_at`,
        [sha256(token), b.shopId, shop.name, JSON.stringify(snapshot), total, b.phone.trim(), b.address.trim(), (b.comment || "").trim()]
      );
      return json(res, 201, { order: inserted.rows[0], trackingToken: token });
    } catch (e) { console.error("create order:", e.message); return json(res, 500, { error: "Не удалось оформить заказ" }); }
  }

  if (req.method === "POST" && path === "/api/individual-requests") {
    try {
      const b = await readBody(req);
      if (!str(b.storeName,2,120) || !str(b.storeAddress,5,300) || !str(b.itemsText,3,5000) ||
          !str(b.deliveryAddress,5,300) || !str(b.phone,7,30) || (b.comment !== undefined && !str(b.comment,0,1000)))
        return json(res, 400, { error: "Проверьте данные индивидуальной заявки" });
      const r = await pool.query(
        `INSERT INTO preview_individual_requests (store_name,store_address,items_text,delivery_address,customer_phone,customer_comment)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,request_number,status,created_at`,
        [b.storeName.trim(),b.storeAddress.trim(),b.itemsText.trim(),b.deliveryAddress.trim(),b.phone.trim(),(b.comment||"").trim()]
      );
      return json(res, 201, { request: r.rows[0] });
    } catch (e) { console.error("individual request:",e.message); return json(res,500,{error:"Не удалось отправить заявку"}); }
  }

  const track = path.match(/^\/api\/orders\/([0-9a-f-]{36})$/i);
  if (req.method === "GET" && track) {
    const token = req.headers["x-order-token"] || url.searchParams.get("token");
    if (typeof token !== "string" || token.length < 32) return json(res,404,{error:"Заказ не найден"});
    try {
      const r = await pool.query("SELECT id,order_number,shop_name,items,items_total_rub,delivery_fee_rub,total_rub,status,created_at,updated_at FROM preview_orders WHERE id=$1 AND tracking_token_hash=$2",[track[1],sha256(token)]);
      return r.rowCount ? json(res,200,{order:r.rows[0]}) : json(res,404,{error:"Заказ не найден"});
    } catch { return json(res,500,{error:"Не удалось получить заказ"}); }
  }

  if (path.startsWith("/api/admin/")) {
    if (!ADMIN_KEY || !safeEqual(req.headers["x-admin-key"], ADMIN_KEY)) return json(res,401,{error:"Требуется доступ оператора"});
    try {
      if (req.method === "GET" && path === "/api/admin/orders") {
        const r = await pool.query("SELECT id,order_number,shop_id,shop_name,items,items_total_rub,delivery_fee_rub,total_rub,customer_phone,delivery_address,customer_comment,status,created_at,updated_at FROM preview_orders ORDER BY created_at DESC LIMIT 100");
        return json(res,200,{orders:r.rows});
      }
      if (req.method === "GET" && path === "/api/admin/individual-requests") {
        const r = await pool.query("SELECT id,request_number,store_name,store_address,items_text,delivery_address,customer_phone,customer_comment,status,created_at,updated_at FROM preview_individual_requests ORDER BY created_at DESC LIMIT 100");
        return json(res,200,{requests:r.rows});
      }
      const orderStatus = path.match(/^\/api\/admin\/orders\/([0-9a-f-]{36})\/status$/i);
      if (req.method === "PATCH" && orderStatus) {
        const b = await readBody(req);
        if (!validStatuses.includes(b.status)) return json(res,400,{error:"Недопустимый статус заказа"});
        const r = await pool.query("UPDATE preview_orders SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,order_number,status,updated_at",[b.status,orderStatus[1]]);
        return r.rowCount ? json(res,200,{order:r.rows[0]}) : json(res,404,{error:"Заказ не найден"});
      }
      const fee = path.match(/^\/api\/admin\/orders\/([0-9a-f-]{36})\/delivery-fee$/i);
      if (req.method === "PATCH" && fee) {
        const b = await readBody(req);
        if (!Number.isInteger(b.deliveryFeeRub) || b.deliveryFeeRub < 0 || b.deliveryFeeRub > 10000) return json(res,400,{error:"Некорректная стоимость доставки"});
        const r = await pool.query("UPDATE preview_orders SET delivery_fee_rub=$1,total_rub=items_total_rub+$1,updated_at=NOW() WHERE id=$2 RETURNING id,items_total_rub,delivery_fee_rub,total_rub,updated_at",[b.deliveryFeeRub,fee[1]]);
        return r.rowCount ? json(res,200,{order:r.rows[0]}) : json(res,404,{error:"Заказ не найден"});
      }
      const requestStatus = path.match(/^\/api\/admin\/individual-requests\/([0-9a-f-]{36})\/status$/i);
      if (req.method === "PATCH" && requestStatus) {
        const b = await readBody(req);
        if (!validRequestStatuses.includes(b.status)) return json(res,400,{error:"Недопустимый статус заявки"});
        const r = await pool.query("UPDATE preview_individual_requests SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,request_number,status,updated_at",[b.status,requestStatus[1]]);
        return r.rowCount ? json(res,200,{request:r.rows[0]}) : json(res,404,{error:"Заявка не найдена"});
      }
    } catch (e) { console.error("admin API:",e.message); return json(res,500,{error:"Ошибка операторского API"}); }
  }

  return json(res,404,{error:"Not found"});
});

initDb().then(() => {
  server.listen(PORT,"0.0.0.0",() => console.log("Tim-Tim preview API listening on",PORT));
}).catch(error => {
  console.error("Database initialization failed:",error.message);
  server.listen(PORT,"0.0.0.0",() => console.log("Tim-Tim preview API listening without database; configure DATABASE_URL"));
});
