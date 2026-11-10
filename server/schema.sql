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

ALTER TABLE shops ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Другое';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;

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
ON CONFLICT (id) DO NOTHING;

INSERT INTO shops (id, name, category, description, image_url, website, phone, address) VALUES
  (5, 'Хлебный дворик', 'Выпечка', 'Кулинария и кондитерская: десерты, выпечка, торты, хлеб, завтраки и готовые блюда.', 'https://static.tildacdn.com/tild6563-3663-4463-b362-316236616361/_.png', 'https://khlebnyi-dvorik.ru/', '+7 (989) 849-99-55', 'г. Тимашевск, ул. 50 лет Октября, 197')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, website=EXCLUDED.website, phone=EXCLUDED.phone, address=EXCLUDED.address;

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
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, shop_id, name, price_rub, unit, category, description, image_url, source_url) VALUES
  (12,5,'Пирожное шу',95,'шт.','Десерты','Заварное тесто, крем чиз и заварной крем.','https://static.tildacdn.com/stor3064-6438-4134-a539-353266666130/c0825bdf27c1ecfc5a4d74e4d0721676.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/905657205682-pirozhnoe-shu'),
  (13,5,'Эклер с крем чиз',90,'шт.','Десерты','Заварное тесто, начинка из сливочного сыра.','https://static.tildacdn.com/stor6636-3434-4535-a265-656437636432/222c4c2698c8ae4a22200a61c341dd2e.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/752652387112-ekler-s-krem-chiz'),
  (14,5,'Мини синабон с шоколадом',140,'шт.','Выпечка','Тесто, шоколадная начинка, глазурь.','https://static.tildacdn.com/stor6233-6237-4336-a438-326230326261/98afdb5740a2d33e8acfa89b5715e22a.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/770869960362-mini-sinabon-s-shokoladom'),
  (15,5,'Мини синабон с корицей',90,'шт.','Выпечка','Тесто, корица, сахар, глазурь.','https://static.tildacdn.com/stor3866-3131-4833-b966-373439646264/715913cbb976801c7febde47ed686b96.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/776782709542-mini-sinabon-s-koritsei'),
  (16,5,'Рулет маковый',250,'шт.','Выпечка','Тесто и маковая начинка.','https://static.tildacdn.com/stor3637-6430-4436-b636-633262313763/4679bd0ee3ae43af59d0b4a17d3b3713.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/537353062012-rulet-makovii'),
  (17,5,'Котлета куриная рубленная',190,'200 г','Кулинария','Куриное филе, лук, яйцо, специи, панировочные сухари или мука. Минимальный заказ — от 200 г.','https://static.tildacdn.com/stor6435-3765-4430-b832-373362306261/54b2141a83e8062d29b198ca529c8fdd.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/186221936932-kotleta-kurinaya-rublennaya'),
  (18,5,'Котлета печеночная',158,'200 г','Кулинария','Куриная или говяжья печень, лук, яйцо, мука, специи. Минимальный заказ — от 200 г.','https://static.tildacdn.com/stor3565-3832-4538-b337-303661386361/fe337275c552b4fec7d8418912a472a7.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/373588448892-kotleta-pechenochnaya'),
  (19,5,'Голубцы куриные',200,'200 г','Кулинария','Куриный фарш, рис, лук, морковь, капуста, томатный соус. Минимальный заказ — от 200 г.','https://static.tildacdn.com/stor3865-3062-4834-b738-333138326461/7ac62b74fd97836e0840a85300713752.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/655406751572-golubtsi-kurinie')
ON CONFLICT (id) DO UPDATE SET shop_id=EXCLUDED.shop_id, name=EXCLUDED.name, price_rub=EXCLUDED.price_rub, unit=EXCLUDED.unit, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, source_url=EXCLUDED.source_url;

-- Pharmacy delivery remains disabled until legal and partner checks are completed.
UPDATE shops SET is_active = FALSE WHERE id = 3;
UPDATE products SET is_active = FALSE WHERE shop_id = 3;
