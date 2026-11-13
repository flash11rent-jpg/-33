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

  if (req.method === "GET" && path === "/track") {
    const id = url.searchParams.get("id") || "";
    const token = url.searchParams.get("token") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 32 || token.length > 200) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end("<!doctype html><meta charset=utf-8><title>Тим-Тим — заказ</title><p>Некорректная ссылка на заказ.</p>");
    }
    const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow">
<title>Мой заказ — Тим-Тим</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f4ef;color:#183d32;font:16px/1.5 Manrope,Arial,sans-serif}
main{max-width:680px;margin:0 auto;padding:28px 18px 56px}.brand{font-weight:800;letter-spacing:.04em;color:#183d32}
.card{margin-top:22px;background:#fff;border:1px solid #e6e8e1;border-radius:22px;padding:24px;box-shadow:0 12px 36px #183d3210}
h1{font-size:28px;margin:8px 0 4px}.muted{color:#718078}.status{display:inline-flex;padding:8px 14px;border-radius:999px;background:#e7f1e9;color:#245c3e;font-weight:700;margin:14px 0}
.line{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid #edf0eb}.line:last-child{border:0}
.items{padding:0;list-style:none}.items li{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #edf0eb}
.total{font-size:20px;font-weight:800}.error{color:#a33}.refresh{border:0;border-radius:12px;background:#1d513e;color:white;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer;margin-top:18px}
@media(max-width:480px){.card{padding:18px}h1{font-size:24px}.line{display:block}.line strong{display:block}}
</style></head><body><main><div class="brand">ТИМ-ТИМ</div><section class="card" id="card"><div class="muted">Информация о доставке</div><h1>Ваш заказ</h1><p class="muted">Загружаем информацию…</p></section></main>
<script>
const orderId=${JSON.stringify(id)}, token=${JSON.stringify(token)};
const card=document.getElementById("card");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rub=n=>new Intl.NumberFormat("ru-RU").format(Number(n)||0)+" ₽";
async function load(){
 try{
  const r=await fetch("/api/orders/"+encodeURIComponent(orderId)+"?token="+encodeURIComponent(token),{cache:"no-store"});
  const data=await r.json(); if(!r.ok||!data.order) throw new Error(data.error||"Заказ не найден");
  const o=data.order, items=Array.isArray(o.items)?o.items:[];
  const status=o.status||"Принят";
  card.innerHTML='<div class="muted">Информация о доставке</div><h1>Заказ №'+esc(o.order_number)+'</h1><div class="status">'+esc(status)+'</div>'+
   '<div class="line"><span class="muted">Магазин</span><strong>'+esc(o.shop_name)+'</strong></div>'+
   '<h3>Состав заказа</h3><ul class="items">'+items.map(x=>'<li><span>'+esc(x.name)+' × '+esc(x.qty)+'</span><strong>'+rub(x.lineTotal??(x.price*x.qty))+'</strong></li>').join("")+'</ul>'+
   '<div class="line"><span class="muted">Товары</span><strong>'+rub(o.items_total_rub)+'</strong></div>'+
   '<div class="line"><span class="muted">Доставка</span><strong>'+(o.delivery_fee_rub==null?"Уточняется":rub(o.delivery_fee_rub))+'</strong></div>'+
   '<div class="line total"><span>Итого</span><strong>'+rub(o.total_rub)+'</strong></div>'+
   '<p class="muted">Статус обновляется по мере обработки заказа. Сохраните эту ссылку, чтобы вернуться к заказу.</p>'+
   '<button class="refresh" type="button" onclick="load()">Обновить статус</button>';
 }catch(e){card.innerHTML='<h1>Не удалось открыть заказ</h1><p class="error">'+esc(e.message)+'</p><p class="muted">Проверьте, что открыта полная ссылка из сообщения после оформления заказа.</p>'}
}
load();
</script></body></html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
    return res.end(html);
  }

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
      const trackingUrl = "https://" + req.headers.host + "/track?id=" + encodeURIComponent(inserted.rows[0].id) + "&token=" + encodeURIComponent(token);
      return json(res, 201, { order: inserted.rows[0], trackingToken: token, trackingUrl });
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
