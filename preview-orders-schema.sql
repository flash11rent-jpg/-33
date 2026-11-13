CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS preview_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  tracking_token_hash CHAR(64) NOT NULL,
  shop_id INTEGER NOT NULL,
  shop_name TEXT NOT NULL,
  items JSONB NOT NULL,
  items_total_rub INTEGER NOT NULL CHECK (items_total_rub >= 700),
  delivery_fee_rub INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_rub >= 0),
  total_rub INTEGER NOT NULL CHECK (total_rub >= 700),
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  customer_comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Новый'
    CHECK (status IN ('Новый','Подтверждён','Собирается','Готов','В пути','Доставлен','Отменён')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS preview_orders_created_idx ON preview_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS preview_orders_tracking_idx ON preview_orders(id, tracking_token_hash);

CREATE TABLE IF NOT EXISTS preview_individual_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  store_name TEXT NOT NULL,
  store_address TEXT NOT NULL,
  items_text TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Новая заявка'
    CHECK (status IN ('Новая заявка','Проверяется','Согласована','Покупка выполняется','Выполнена','Отменена')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS preview_requests_created_idx ON preview_individual_requests(created_at DESC);
