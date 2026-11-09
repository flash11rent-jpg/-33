CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  price_rub INTEGER NOT NULL CHECK (price_rub >= 0),
  unit TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  tracking_token_hash CHAR(64) NOT NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
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

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_tracking_hash_idx ON orders(id, tracking_token_hash);

INSERT INTO shops (id, name, category) VALUES
  (1, 'Продукты у дома', 'Продукты'),
  (2, 'Цветочный мир', 'Цветы'),
  (3, 'Аптека рядом', 'Аптеки'),
  (4, 'Дом и уют', 'Для дома')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;

INSERT INTO products (id, shop_id, name, price_rub, unit) VALUES
  (1,1,'Молоко 3,2%',95,'1 л'),
  (2,1,'Хлеб белый',45,'шт.'),
  (3,1,'Яйца С1',110,'10 шт.'),
  (4,1,'Бананы',130,'1 кг'),
  (5,1,'Сыр',220,'300 г'),
  (6,2,'Букет цветов',1800,'букет'),
  (7,2,'Ромашки',900,'букет'),
  (8,2,'Тюльпаны',1200,'букет'),
  (9,3,'Витамины (пример)',250,'упаковка'),
  (10,4,'Средство для посуды',160,'шт.'),
  (11,4,'Бумажные полотенца',190,'упаковка')
ON CONFLICT (id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id, name = EXCLUDED.name,
  price_rub = EXCLUDED.price_rub, unit = EXCLUDED.unit,
  updated_at = NOW();
