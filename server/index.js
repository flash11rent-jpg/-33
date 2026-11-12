import express from "express";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const { Pool } = pg;
const app = express();
// Render runs behind a trusted reverse proxy; required for rate-limit client IP detection.
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 10000);
const databaseUrl = process.env.DATABASE_URL;
const adminApiKey = process.env.ADMIN_API_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;
const configuredOrigins = (process.env.CORS_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : ["https://tim-tim23.onrender.com", "https://tim-tim.onrender.com"];

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Configure a PostgreSQL database before starting the API.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", err => console.error("Unexpected PostgreSQL pool error:", err.message));

app.disable("x-powered-by");
app.use(helmet());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key, X-Order-Token");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  }
  return res.status(403).json({ error: "Origin is not allowed" });
});
app.use(express.json({ limit: "2.5mb" }));

const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false });
const statusLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });

const createIndividualRequestSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  storeAddress: z.string().trim().min(5).max(300),
  itemsText: z.string().trim().min(3).max(5000),
  deliveryAddress: z.string().trim().min(5).max(300),
  phone: z.string().trim().min(7).max(30),
  comment: z.string().trim().max(1000).optional().default("")
}).strict();

const createOrderSchema = z.object({
  shopId: z.number().int().positive(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    qty: z.number().int().min(1).max(50)
  })).min(1).max(50),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  comment: z.string().trim().max(1000).optional().default("")
}).strict();

const validStatuses = ["Новый", "Подтверждён", "Собирается", "Готов", "В пути", "Доставлен", "Отменён"];
const validIndividualStatuses = ["Новая заявка", "Проверяется", "Согласована", "Покупка выполняется", "Выполнена", "Отменена"];
const sha256 = value => createHash("sha256").update(value).digest("hex");
const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};

function cookieValue(req, name) {
  const cookies = (req.headers.cookie || "").split(";");
  const entry = cookies.map(v => v.trim()).find(v => v.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}
function signSession(payload) {
  return payload + "." + createHmac("sha256", adminApiKey).update(payload).digest("base64url");
}
function validSession(token) {
  if (!adminApiKey || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = createHmac("sha256", adminApiKey).update(parts[0]).digest("base64url");
  if (!safeEqual(parts[1], expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > Date.now();
  } catch { return false; }
}
function requireAdmin(req, res, next) {
  const supplied = req.get("x-admin-key") || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (adminApiKey && supplied && safeEqual(supplied, adminApiKey)) return next();
  if (validSession(supplied) || validSession(cookieValue(req, "tt_admin"))) {
    if (!req.headers.origin || !allowedOrigins.includes(req.headers.origin)) {
      return res.status(403).json({ error: "Недопустимый источник запроса" });
    }
    return next();
  }
  return res.status(401).json({ error: "Требуется вход оператора" });
}

app.get("/api/brand", async (_req, res, next) => { try { const result = await pool.query("SELECT value FROM app_settings WHERE key = $1", ["brand_logo"]); return res.set("Cache-Control", "public, max-age=30").json({ logo: result.rows[0]?.value || null }); } catch (error) { return next(error); } });

app.patch("/api/admin/brand", requireAdmin, async (req, res, next) => { try { const parsed = z.object({ logo: z.string().max(1200000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/) }).strict().safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: "Загрузите PNG, JPG или WebP до 900 КБ" }); const result = await pool.query("INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING value", ["brand_logo", parsed.data.logo]); return res.json({ ok: true, logo: result.rows[0].value }); } catch (error) { return next(error); } });

const publicApiUrl = (process.env.PUBLIC_API_URL || "https://tim-tim-api.onrender.com").replace(/\/+$/, "");
function catalogImageUrl(kind, id, value) {
  return typeof value === "string" && value.startsWith("data:image/")
    ? publicApiUrl + "/api/media/" + kind + "/" + id
    : value;
}

app.get("/api/media/:kind/:id", async (req, res, next) => {
  try {
    const kind = req.params.kind;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1 || !["shop", "shop-logo", "product", "category"].includes(kind)) return res.status(404).end();
    const table = kind === "shop" || kind === "shop-logo" ? "shops" : kind === "product" ? "products" : "catalog_categories";
    const column = kind === "shop-logo" ? "logo_url" : "image_url";
    const result = await pool.query("SELECT " + column + " AS image_url FROM " + table + " WHERE id = $1", [id]);
    const value = result.rows[0]?.image_url;
    if (typeof value !== "string" || !value.startsWith("data:image/")) return res.status(404).end();
    const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(404).end();
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length > 700 * 1024) return res.status(413).end();
    res.set("Content-Type", "image/" + match[1]);
    res.set("Cache-Control", "no-store");
    return res.send(bytes);
  } catch (error) { return next(error); }
});

app.get("/api/catalog", async (_req, res, next) => {
  try {
    const [shopsResult, productsResult, categoriesResult] = await Promise.all([
      pool.query("SELECT id, name, category, description, image_url, logo_url, card_background, website, phone, address, maps_url FROM shops WHERE is_active = TRUE ORDER BY id"),
      pool.query("SELECT id, shop_id, name, price_rub, unit, category, description, image_url, source_url FROM products WHERE is_active = TRUE ORDER BY shop_id, id"),
      pool.query("SELECT id, name, category_type, emoji, image_url, sort_order FROM catalog_categories WHERE is_active = TRUE ORDER BY category_type, sort_order, name")
    ]);
    return res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120").json({
      shops: shopsResult.rows.map(item => ({...item, image_url: catalogImageUrl("shop", item.id, item.image_url), logo_url: item.logo_url ? catalogImageUrl("shop-logo", item.id, item.logo_url) : null})),
      products: productsResult.rows.map(item => ({...item, image_url: catalogImageUrl("product", item.id, item.image_url)})),
      categories: categoriesResult.rows.map(item => ({...item, image_url: catalogImageUrl("category", item.id, item.image_url)}))
    });
  } catch (error) { return next(error); }
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "tim-tim-api" }));
app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, database: "connected" });
  } catch {
    return res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.post("/api/orders", orderLimiter, async (req, res, next) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте данные заказа", details: parsed.error.issues });
    const { shopId, items, phone, address, comment } = parsed.data;
    const quantities = new Map();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.qty);
    if ([...quantities.values()].some(qty => qty > 50)) return res.status(400).json({ error: "Слишком большое количество товара" });
    const ids = [...quantities.keys()];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const shopResult = await client.query("SELECT id, name FROM shops WHERE id = $1 AND is_active = TRUE", [shopId]);
      if (!shopResult.rowCount) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Магазин временно недоступен" });
      }
      const productResult = await client.query(
        "SELECT id, name, price_rub, unit FROM products WHERE shop_id = $1 AND id = ANY($2::int[]) AND is_active = TRUE FOR SHARE",
        [shopId, ids]
      );
      if (productResult.rowCount !== ids.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Один или несколько товаров недоступны. Обновите корзину." });
      }
      const catalogue = new Map(productResult.rows.map(p => [p.id, p]));
      const snapshot = ids.map(id => {
        const p = catalogue.get(id);
        const qty = quantities.get(id);
        return { productId: p.id, name: p.name, unit: p.unit, price: p.price_rub, qty, lineTotal: p.price_rub * qty };
      });
      const itemsTotal = snapshot.reduce((sum, item) => sum + item.lineTotal, 0);
      if (itemsTotal < 700) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Минимальная сумма товаров — 700 ₽" });
      }
      const trackingToken = randomBytes(32).toString("base64url");
      const inserted = await client.query(
        `INSERT INTO orders (tracking_token_hash, shop_id, shop_name, items, items_total_rub, total_rub, customer_phone, delivery_address, customer_comment)
         VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8)
         RETURNING id, order_number, status, total_rub, created_at`,
        [sha256(trackingToken), shopId, shopResult.rows[0].name, JSON.stringify(snapshot), itemsTotal, phone, address, comment]
      );
      await client.query("COMMIT");
      return res.status(201).json({ order: inserted.rows[0], trackingToken });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) { return next(error); }
});

app.post("/api/individual-requests", orderLimiter, async (req, res, next) => {
  try {
    const parsed = createIndividualRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте данные индивидуальной заявки" });
    const { storeName, storeAddress, itemsText, deliveryAddress, phone, comment } = parsed.data;
    const result = await pool.query(
      `INSERT INTO individual_requests (store_name, store_address, items_text, delivery_address, customer_phone, customer_comment)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, request_number, status, created_at`,
      [storeName, storeAddress, itemsText, deliveryAddress, phone, comment]
    );
    return res.status(201).json({ request: result.rows[0] });
  } catch (error) { return next(error); }
});

app.get("/api/orders/:id", statusLimiter, async (req, res, next) => {
  try {
    const token = req.get("x-order-token") || req.query.token;
    if (typeof token !== "string" || token.length < 32) return res.status(404).json({ error: "Заказ не найден" });
    const result = await pool.query(
      "SELECT id, order_number, shop_name, items, items_total_rub, delivery_fee_rub, total_rub, status, created_at, updated_at FROM orders WHERE id = $1 AND tracking_token_hash = $2",
      [req.params.id, sha256(token)]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Заказ не найден" });
    return res.json({ order: result.rows[0] });
  } catch (error) { return next(error); }
});

app.post("/api/admin/login", loginLimiter, (req, res) => {
  if (!adminPassword || !adminApiKey) return res.status(503).json({ error: "Вход оператора не настроен" });
  const parsed = z.object({ password: z.string().min(1).max(200) }).strict().safeParse(req.body);
  if (!parsed.success || !safeEqual(parsed.data.password, adminPassword)) {
    return res.status(401).json({ error: "Неверный пароль" });
  }
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const token = signSession(payload);
  // Return the short-lived signed session token so the cross-origin PWA can
  // authenticate subsequent API calls without relying on browser cookie policies.
  res.setHeader("Set-Cookie", "tt_admin=" + encodeURIComponent(token) + "; HttpOnly; Secure; SameSite=Lax; Path=/api/admin; Max-Age=28800");
  return res.json({ ok: true, sessionToken: token });
});

app.post("/api/admin/logout", requireAdmin, (_req, res) => {
  res.setHeader("Set-Cookie", "tt_admin=; HttpOnly; Secure; SameSite=Lax; Path=/api/admin; Max-Age=0");
  return res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const result = await pool.query(
      "SELECT id, order_number, shop_id, shop_name, items, items_total_rub, delivery_fee_rub, total_rub, customer_phone, delivery_address, customer_comment, status, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    return res.json({ orders: result.rows });
  } catch (error) { return next(error); }
});

app.get("/api/admin/individual-requests", requireAdmin, async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT id, request_number, store_name, store_address, items_text, delivery_address, customer_phone, customer_comment, status, created_at FROM individual_requests ORDER BY created_at DESC LIMIT 100");
    return res.json({ requests: result.rows });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/individual-requests/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    const status = z.string().refine(value => validIndividualStatuses.includes(value)).safeParse(req.body?.status);
    if (!id.success || !status.success) return res.status(400).json({ error: "Проверьте идентификатор заявки и её статус" });
    const result = await pool.query(
      "UPDATE individual_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, request_number, status, updated_at",
      [status.data, id.data]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Заявка не найдена" });
    return res.json({ request: result.rows[0] });
  } catch (error) { return next(error); }
});

app.get("/api/admin/catalog", requireAdmin, async (_req, res, next) => {
  try {
    const [shops, products, categories] = await Promise.all([
      pool.query("SELECT id, name, category, description, image_url, logo_url, card_background, website, phone, address, maps_url, is_active, created_at FROM shops ORDER BY id"),
      pool.query("SELECT id, shop_id, name, price_rub, unit, category, description, image_url, source_url, is_active, updated_at FROM products ORDER BY shop_id, id"),
      pool.query("SELECT id, name, category_type, emoji, image_url, sort_order, is_active FROM catalog_categories ORDER BY category_type, sort_order, name")
    ]);
    return res.json({
      shops: shops.rows.map(item => ({...item, image_url: catalogImageUrl("shop", item.id, item.image_url), logo_url: item.logo_url ? catalogImageUrl("shop-logo", item.id, item.logo_url) : null})),
      products: products.rows.map(item => ({...item, image_url: catalogImageUrl("product", item.id, item.image_url)})),
      categories: categories.rows.map(item => ({...item, image_url: catalogImageUrl("category", item.id, item.image_url)}))
    });
  } catch (error) { return next(error); }
});

app.post("/api/admin/shops", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      name: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(60),
      description: z.string().trim().max(500).optional().default(""), imageUrl: imageValue, logoUrl: imageValue,
      cardBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#ffffff"),
      website: z.string().trim().max(300).optional().default(""), phone: z.string().trim().max(50).optional().default(""),
      address: z.string().trim().max(300).optional().default(""), mapsUrl: z.string().trim().max(500).optional().default("")
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте название, категорию и поля карточки магазина" });
    const d = parsed.data;
    const result = await pool.query(
      "INSERT INTO shops (id,name,category,description,image_url,logo_url,card_background,website,phone,address,maps_url) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM shops),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,name,category,description,image_url,logo_url,card_background,website,phone,address,maps_url,is_active",
      [d.name,d.category,d.description,d.imageUrl||null,d.logoUrl||null,d.cardBackground,d.website||null,d.phone||null,d.address||null,d.mapsUrl||null]
    );
    const item = result.rows[0];
    return res.status(201).json({ shop: {...item, image_url: catalogImageUrl("shop",item.id,item.image_url), logo_url: item.logo_url ? catalogImageUrl("shop-logo",item.id,item.logo_url) : null} });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/shops/:id", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      name: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(60),
      description: z.string().trim().max(500).optional().default(""), imageUrl: imageValue, logoUrl: imageValue,
      cardBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#ffffff"),
      website: z.string().trim().max(300).optional().default(""), phone: z.string().trim().max(50).optional().default(""),
      address: z.string().trim().max(300).optional().default(""), mapsUrl: z.string().trim().max(500).optional().default(""),
      isActive: z.boolean()
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте данные карточки магазина" });
    const d = parsed.data;
    const result = await pool.query(
      "UPDATE shops SET name=$1,category=$2,description=$3,image_url=CASE WHEN $4=$12 THEN image_url ELSE $4 END,logo_url=CASE WHEN $5=$11 THEN logo_url ELSE $5 END,card_background=$6,website=$7,phone=$8,address=$9,maps_url=$10,is_active=$13 WHERE id=$14 RETURNING id,name,category,description,image_url,logo_url,card_background,website,phone,address,maps_url,is_active",
      [d.name,d.category,d.description,d.imageUrl??null,d.logoUrl??null,d.cardBackground,d.website||null,d.phone||null,d.address||null,d.mapsUrl||null,publicApiUrl + "/api/media/shop-logo/" + req.params.id,publicApiUrl + "/api/media/shop/" + req.params.id,d.isActive,req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Магазин не найден" });
    const item = result.rows[0];
    // Never report a successful upload unless both submitted image payloads were persisted.
    if (typeof d.imageUrl === "string" && d.imageUrl.startsWith("data:image/") && item.image_url !== d.imageUrl) {
      return res.status(500).json({ error: "Не удалось сохранить большую фотографию магазина. Попробуйте ещё раз." });
    }
    if (typeof d.logoUrl === "string" && d.logoUrl.startsWith("data:image/") && item.logo_url !== d.logoUrl) {
      return res.status(500).json({ error: "Не удалось сохранить логотип магазина. Попробуйте ещё раз." });
    }
    return res.json({ shop: {...item, image_url: catalogImageUrl("shop",item.id,item.image_url), logo_url: item.logo_url ? catalogImageUrl("shop-logo",item.id,item.logo_url) : null} });
  } catch (error) { return next(error); }
});

app.post("/api/admin/products", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      shopId: z.number().int().positive(), name: z.string().trim().min(2).max(140),
      priceRub: z.number().int().min(0).max(10000000), unit: z.string().trim().min(1).max(40),
      category: z.string().trim().min(1).max(80).optional().default("Другое"),
      description: z.string().trim().max(1000).optional().default(""), imageUrl: imageValue,
      sourceUrl: z.string().trim().max(500).optional().default("")
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте магазин, название, цену, единицу и фотографию товара" });
    const d = parsed.data;
    const result = await pool.query(
      "INSERT INTO products (id,shop_id,name,price_rub,unit,category,description,image_url,source_url) SELECT COALESCE(MAX(id),0)+1,$1,$2,$3,$4,$5,$6,$7,$8 FROM products RETURNING id,shop_id,name,price_rub,unit,category,description,image_url,source_url,is_active",
      [d.shopId,d.name,d.priceRub,d.unit,d.category,d.description,d.imageUrl||null,d.sourceUrl||null]
    );
    const item = result.rows[0];
    return res.status(201).json({ product: {...item, image_url: catalogImageUrl("product",item.id,item.image_url)} });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      shopId: z.number().int().positive(), name: z.string().trim().min(2).max(140),
      priceRub: z.number().int().min(0).max(10000000), unit: z.string().trim().min(1).max(40),
      category: z.string().trim().min(1).max(80).optional().default("Другое"),
      description: z.string().trim().max(1000).optional().default(""), imageUrl: imageValue,
      sourceUrl: z.string().trim().max(500).optional().default(""), isActive: z.boolean()
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте данные товара" });
    const d = parsed.data;
    const result = await pool.query(
      "UPDATE products SET shop_id=$1,name=$2,price_rub=$3,unit=$4,category=$5,description=$6,image_url=CASE WHEN $7=$10 THEN image_url ELSE $7 END,source_url=$8,is_active=$9,updated_at=NOW() WHERE id=$11 RETURNING id,shop_id,name,price_rub,unit,category,description,image_url,source_url,is_active",
      [d.shopId,d.name,d.priceRub,d.unit,d.category,d.description,d.imageUrl??null,d.sourceUrl||null,d.isActive,publicApiUrl + "/api/media/product/" + req.params.id,req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Товар не найден" });
    const item = result.rows[0];
    return res.json({ product: {...item, image_url: catalogImageUrl("product",item.id,item.image_url)} });
  } catch (error) { return next(error); }
});

app.post("/api/admin/categories", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      name: z.string().trim().min(2).max(80), categoryType: z.enum(["shop","product"]),
      emoji: z.string().trim().max(12).optional().default("🛍️"), imageUrl: imageValue,
      sortOrder: z.number().int().min(0).max(10000).optional().default(100)
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Укажите название и тип категории" });
    const d = parsed.data;
    const result = await pool.query(
      "INSERT INTO catalog_categories (name,category_type,emoji,image_url,sort_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (category_type,name) DO UPDATE SET emoji=EXCLUDED.emoji,image_url=COALESCE(EXCLUDED.image_url,catalog_categories.image_url),is_active=TRUE RETURNING id,name,category_type,emoji,image_url,sort_order,is_active",
      [d.name,d.categoryType,d.emoji,d.imageUrl||null,d.sortOrder]
    );
    const item = result.rows[0];
    return res.status(201).json({ category: {...item, image_url: catalogImageUrl("category",item.id,item.image_url)} });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    const imageValue = z.string().max(900000).nullable().optional().refine(v => v == null || /^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https?:\/\//.test(v));
    const parsed = z.object({
      name: z.string().trim().min(2).max(80), emoji: z.string().trim().max(12).optional().default("🛍️"),
      imageUrl: imageValue, sortOrder: z.number().int().min(0).max(10000).optional().default(100), isActive: z.boolean()
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Проверьте данные категории" });
    const d = parsed.data;
    const result = await pool.query(
      "UPDATE catalog_categories SET name=$1,emoji=$2,image_url=CASE WHEN $3=$6 THEN image_url ELSE $3 END,sort_order=$4,is_active=$5 WHERE id=$7 RETURNING id,name,category_type,emoji,image_url,sort_order,is_active",
      [d.name,d.emoji,d.imageUrl??null,d.sortOrder,d.isActive,publicApiUrl + "/api/media/category/" + req.params.id,req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Категория не найдена" });
    const item = result.rows[0];
    return res.json({ category: {...item, image_url: catalogImageUrl("category",item.id,item.image_url)} });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const status = z.string().refine(value => validStatuses.includes(value)).safeParse(req.body?.status);
    if (!status.success) return res.status(400).json({ error: "Недопустимый статус заказа" });
    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, order_number, status, updated_at",
      [status.data, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Заказ не найден" });
    return res.json({ order: result.rows[0] });
  } catch (error) { return next(error); }
});

app.patch("/api/admin/orders/:id/delivery-fee", requireAdmin, async (req, res, next) => {
  try {
    const fee = z.number().int().min(0).max(10000).safeParse(req.body?.deliveryFeeRub);
    if (!fee.success) return res.status(400).json({ error: "Стоимость доставки должна быть от 0 до 10 000 ₽" });
    const result = await pool.query(
      "UPDATE orders SET delivery_fee_rub = $1, total_rub = items_total_rub + $1, updated_at = NOW() WHERE id = $2 RETURNING id, items_total_rub, delivery_fee_rub, total_rub, updated_at",
      [fee.data, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Заказ не найден" });
    return res.json({ order: result.rows[0] });
  } catch (error) { return next(error); }
});

app.use((error, _req, res, _next) => {
  console.error("API error:", error.message);
  return res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

async function start() {
  const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  const server = app.listen(port, "0.0.0.0", () => console.log("Tim-Tim API listening on " + port));
  async function shutdown(signal) {
    console.log(signal + ": shutting down");
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch(error => {
  console.error("API startup failed:", error.message);
  process.exit(1);
});
