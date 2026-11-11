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
ALTER TABLE shops ADD COLUMN IF NOT EXISTS maps_url TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Другое';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE TABLE IF NOT EXISTS individual_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  store_name TEXT NOT NULL,
  store_address TEXT NOT NULL,
  items_text TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Новая заявка',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ON CONFLICT (id) DO NOTHING;

INSERT INTO shops (id, name, category, description, image_url, website, phone, address) VALUES
  (5, 'Хлебный дворик', 'Выпечка', 'Кулинария и кондитерская: десерты, выпечка, торты, хлеб, завтраки и готовые блюда.', 'https://static.tildacdn.com/tild6563-3663-4463-b362-316236616361/_.png', 'https://khlebnyi-dvorik.ru/', '+7 (989) 849-99-55', 'г. Тимашевск, ул. 50 лет Октября, 197')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, website=EXCLUDED.website, phone=EXCLUDED.phone, address=EXCLUDED.address;

INSERT INTO shops (id, name, category, description, address) VALUES
  (6, 'Мастер', 'Стройматериалы', 'Строительные материалы, инструменты и товары для ремонта. Каталог и цены уточняются у магазина.', 'г. Тимашевск, ул. Ленина, 32')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, address=EXCLUDED.address;

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


-- Expanded verified Khlebny Dvorik catalog. Product images are official Open Graph assets.
INSERT INTO products (id, shop_id, name, price_rub, unit, category, description, image_url, source_url) VALUES
(20,5,'Эклер шоколадный',95,'шт.','Десерты','','https://optim.tildacdn.com/tild6639-3136-4162-b061-333131636565/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/910293384752-ekler-shokoladnii'),
(21,5,'Эклер с заварным кремом',85,'шт.','Десерты','','https://optim.tildacdn.com/tild3130-3365-4233-a365-343731313436/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/648847741012-ekler-s-zavarnim-kremom'),
(22,5,'Пирожное Наполеон',135,'шт.','Десерты','','https://optim.tildacdn.com/tild6238-3837-4332-a364-343661323538/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/188042816402-pirozhnoe-napoleon'),
(23,5,'Пирожное Мигель шоколадный',200,'шт.','Десерты','','https://optim.tildacdn.com/tild3432-6135-4032-a230-373065663137/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/191643081032-pirozhnoe-migel-shokoladnii'),
(24,5,'Пирожное маковое',175,'шт.','Десерты','','https://optim.tildacdn.com/tild6237-3262-4837-a238-616532326536/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/436397022612-pirozhnoe-makovoe'),
(25,5,'Пирожное маковое шоколадное',175,'шт.','Десерты','','https://optim.tildacdn.com/tild3066-6162-4039-a332-656335373939/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/714942066012-pirozhnoe-makovoe-shokoladnoe'),
(26,5,'Круассан с клубникой',350,'шт.','Десерты','','https://optim.tildacdn.com/tild3736-6165-4632-a338-326336303831/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/373413746582-kruassan-s-klubnikoi'),
(27,5,'Круассан Дубай',350,'шт.','Десерты','','https://optim.tildacdn.com/tild6139-6361-4563-a239-326462326465/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/670037881062-kruassan-dubai'),
(28,5,'Круассан со сгущенкой',200,'шт.','Десерты','','https://optim.tildacdn.com/tild3332-3438-4863-b031-653238323439/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/992353444542-kruassan-so-sguschenkoi'),
(29,5,'Венский пирог с творогом орехами и малиной',600,'шт.','Десерты','','https://optim.tildacdn.com/tild3861-3863-4833-a362-363361656632/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/955144132952-venskii-pirog-s-tvorogom-orehami-i-malin'),
(30,5,'Пирожное Малина-манго-маракуйя',175,'шт.','Десерты','','https://optim.tildacdn.com/tild3665-3061-4035-b935-373639613532/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/977531738072-pirozhnoe-malina-mango-marakuiya'),
(31,5,'Пирожное Птичье молоко фисташка',155,'шт.','Десерты','','https://optim.tildacdn.com/tild3336-3337-4065-a139-356333333333/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/382304176522-pirozhnoe-ptiche-moloko-fistashka'),
(32,5,'Пирожное Фундук-тоффи',180,'шт.','Десерты','','https://optim.tildacdn.com/tild3238-3739-4338-a665-393839383937/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/532081193502-pirozhnoe-funduk-toffi'),
(33,5,'Пирожное Кофейный беспредел',155,'шт.','Десерты','','https://optim.tildacdn.com/tild6366-6566-4263-a539-616431643064/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/715063142832-pirozhnoe-kofeinii-bespredel'),
(34,5,'Пирожное Сникерс',235,'шт.','Десерты','','https://optim.tildacdn.com/tild6534-3061-4834-a566-633238373264/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/475934458532-pirozhnoe-snikers'),
(35,5,'Пирожное Калипсо',155,'шт.','Десерты','','https://optim.tildacdn.com/tild3434-6139-4865-a630-623739373833/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/880274108892-pirozhnoe-kalipso'),
(36,5,'Пирожное Орео',180,'шт.','Десерты','','https://optim.tildacdn.com/tild6438-6631-4262-b636-303733303339/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/570367574502-pirozhnoe-oreo'),
(37,5,'Пирожное Молочная девочка',135,'шт.','Десерты','','https://optim.tildacdn.com/tild3531-3363-4661-a133-333032663933/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/867816130112-pirozhnoe-molochnaya-devochka'),
(38,5,'Пирожное Карамельная девочка',135,'шт.','Десерты','','https://optim.tildacdn.com/tild6665-3432-4336-a232-643361663838/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/654283568202-pirozhnoe-karamelnaya-devochka'),
(39,5,'Пирожное Шоколадная девочка',135,'шт.','Десерты','','https://optim.tildacdn.com/tild3965-3463-4637-a635-333939313331/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/470617596702-pirozhnoe-shokoladnaya-devochka'),
(40,5,'Пирожное Эстерхайзи',165,'шт.','Десерты','','https://optim.tildacdn.com/tild3166-3637-4436-a237-343037323236/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/490855415942-pirozhnoe-esterhaizi'),
(41,5,'Пирожное Рафоелло',165,'шт.','Десерты','','https://optim.tildacdn.com/tild6638-3130-4565-a338-313761306632/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/143211402402-pirozhnoe-rafoello'),
(42,5,'Пирожное Киевское',230,'шт.','Десерты','','https://optim.tildacdn.com/tild6138-3438-4566-a362-626336363431/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/500467947432-pirozhnoe-kievskoe'),
(43,5,'Пирожное Фламенко',165,'шт.','Десерты','','https://optim.tildacdn.com/tild3036-3861-4538-b332-333938393833/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/875839751862-pirozhnoe-flamenko'),
(44,5,'Пирожное Красный бархат',145,'шт.','Десерты','','https://optim.tildacdn.com/tild6637-3461-4539-b331-356131306335/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/408815336972-pirozhnoe-krasnii-barhat'),
(45,5,'Пирожное Прага',145,'шт.','Десерты','','https://optim.tildacdn.com/tild6330-3232-4436-a132-636236376336/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/778354013492-pirozhnoe-praga'),
(46,5,'Пирожное Киндер-Пингви',125,'шт.','Десерты','','https://optim.tildacdn.com/tild6435-6638-4436-a337-633435613366/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/445367926372-pirozhnoe-kinder-pingvi'),
(47,5,'Чизкейк фисташковый',210,'шт.','Десерты','','https://optim.tildacdn.com/tild3662-6563-4035-b137-663664633035/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/415900940012-chizkeik-fistashkovii'),
(48,5,'Сан Себастьян классический',165,'шт.','Десерты','','https://optim.tildacdn.com/tild3236-3334-4862-a133-333733356662/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/445584417132-san-sebastyan-klassicheskii'),
(49,5,'Трубочка с белковым кремом',115,'шт.','Десерты','','https://optim.tildacdn.com/tild3262-6362-4431-a266-643831663530/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/893970668152-trubochka-s-belkovim-kremom'),
(50,5,'Кольцо с белковым кремом',75,'шт.','Десерты','','https://optim.tildacdn.com/tild3932-3662-4338-b363-316632343039/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/596843079832-koltso-s-belkovim-kremom'),
(51,5,'Корзинка с белковым кремом',75,'шт.','Десерты','','https://optim.tildacdn.com/tild3262-3361-4433-b135-373835613738/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/682149381852-korzinka-s-belkovim-kremom'),
(52,5,'Анна Павлова',185,'шт.','Десерты','','https://optim.tildacdn.com/tild6631-3133-4562-a266-303733383563/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/261382771142-anna-pavlova'),
(53,5,'Киви с чиа в банке',300,'шт.','Десерты','','https://optim.tildacdn.com/tild6631-3862-4337-a139-373365356231/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/809630430382-kivi-s-chia-v-banke'),
(54,5,'Малина с чиа в банке',300,'шт.','Десерты','','https://optim.tildacdn.com/tild6561-3934-4464-b233-333134376166/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/505255648432-malina-s-chia-v-banke'),
(55,5,'Чиа с гранолой в банке',300,'шт.','Десерты','','https://optim.tildacdn.com/tild6632-6137-4466-a336-313039353930/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/982393176742-chia-s-granoloi-v-banke'),
(56,5,'Тарт вишневый',350,'шт.','Десерты','','https://optim.tildacdn.com/tild3834-6162-4463-a134-313433376262/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/695610888772-tart-vishnevii'),
(57,5,'Тарт облепиховый',350,'шт.','Десерты','','https://optim.tildacdn.com/tild3136-6563-4464-a532-336538633632/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/361245561362-tart-oblepihovii'),
(58,5,'Тарт брусника',350,'шт.','Десерты','','https://optim.tildacdn.com/tild3166-6637-4463-b466-343239636138/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/365277812972-tart-brusnika'),
(59,5,'Тарт чёрная смородина',350,'шт.','Десерты','','https://optim.tildacdn.com/tild6236-3965-4163-a661-643130633338/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/918205461682-tart-chyornaya-smorodina'),
(60,5,'Трайфл красный бархат',300,'шт.','Десерты','','https://optim.tildacdn.com/tild6162-3066-4538-b034-303933316437/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/539052269182-traifl-krasnii-barhat'),
(61,5,'Трайфл тирамису',300,'шт.','Десерты','','https://optim.tildacdn.com/tild3263-6265-4637-a138-393861646465/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/205176612782-traifl-tiramisu'),
(62,5,'Пирожное Сникерс фит',300,'шт.','Десерты','','https://optim.tildacdn.com/tild3037-6461-4339-a366-373761303133/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/242885467232-pirozhnoe-snikers-fit'),
(63,5,'Пирожное Смородина-персик фит',300,'шт.','Десерты','','https://optim.tildacdn.com/tild3439-6234-4533-a263-633234323161/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/171439207422-pirozhnoe-smorodina-persik-fit'),
(64,5,'Бокс сникерс',350,'шт.','Десерты','','https://optim.tildacdn.com/tild6533-3837-4565-a365-363034306436/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/482288241512-boks-snikers'),
(65,5,'Моти в ассортименте',250,'шт.','Десерты','','https://optim.tildacdn.com/tild3738-3838-4436-a538-613431643966/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/332208385272-moti-v-assortimente'),
(66,5,'Пирожное Кучерявый парень',125,'шт.','Десерты','','https://optim.tildacdn.com/tild3939-6132-4266-a332-343261613635/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/534670326832-pirozhnoe-kucheryavii-paren'),
(67,5,'Пирожное Панчо',135,'шт.','Десерты','','https://optim.tildacdn.com/tild3330-3334-4566-a635-373735383230/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/259018863842-pirozhnoe-pancho'),
(68,5,'Зефир в ассортименте',120,'шт.','Десерты','','https://optim.tildacdn.com/tild6533-6638-4133-a132-333635303134/-/cover/1200x1200/background.jpeg','https://khlebnyi-dvorik.ru/catalog/tproduct/355999603972-zefir-v-assortimente'),
(69,5,'Слойка дениш с шоколадом',115,'шт.','Выпечка','','https://static.tildacdn.com/stor3030-3565-4965-b164-663537313862/96f5fbe228eaa3b25d0c605708b96f43.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/268806141512-sloika-denish-s-shokoladom'),
(70,5,'Корзинка сметанник с ягодами',250,'шт.','Выпечка','','https://static.tildacdn.com/stor6263-6561-4261-b539-323133353163/49f737602c7d0c52e37d876e074bb06d.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/867172252352-korzinka-smetannik-s-yagodami'),
(71,5,'Слойка с кокосом',155,'шт.','Выпечка','','https://static.tildacdn.com/stor3834-3464-4633-a365-636664393533/cd13de96cd31bdd736428c9040dfd6e6.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/914205235872-sloika-s-kokosom'),
(72,5,'Берлинец с шоколадом',110,'шт.','Выпечка','','https://static.tildacdn.com/stor3736-6363-4432-a464-626236633662/eeb80eba0df36e2d2a93d187963bf373.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/947689398112-berlinets-s-shokoladom'),
(73,5,'Сочник',75,'шт.','Выпечка','','https://static.tildacdn.com/stor6136-3737-4361-a563-383430366631/47a100074b59b75ff0f6d1bb5ca145d8.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/672675866322-sochnik'),
(74,5,'Слойка с клубникой',85,'шт.','Выпечка','','https://static.tildacdn.com/stor3466-3134-4034-b835-623336316238/cab063971ff2cd586bdbff9c9296f965.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/666601551902-sloika-s-klubnikoi'),
(75,5,'Булочка косичка с джемом',55,'шт.','Выпечка','','https://static.tildacdn.com/stor6138-6365-4630-a661-663535326536/048c87e422cc6b24d0e077e9d98c7a0a.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/447743558842-bulochka-kosichka-s-dzhemom'),
(76,5,'Штрудель с маком',310,'шт.','Выпечка','','https://static.tildacdn.com/stor6665-3735-4530-b862-366135303764/df40bc7757226c6305d5f1f5b4b77025.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/103702293552-shtrudel-s-makom'),
(77,5,'Пирожок сосиска с картошкой',50,'шт.','Выпечка','','https://static.tildacdn.com/stor3461-6562-4635-a134-643739363732/9cc2aaa00de900ece4a1d3bdd9acf4fd.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/889001185512-pirozhok-sosiska-s-kartoshkoi'),
(78,5,'Пирожок с яйцом и луком',65,'шт.','Выпечка','','https://static.tildacdn.com/stor6239-6365-4964-b839-356263636537/b9d5cf694bebaa1318a3660874c0c7de.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/741931819782-pirozhok-s-yaitsom-i-lukom'),
(79,5,'Сосиска в тесте',55,'шт.','Выпечка','','https://static.tildacdn.com/stor3636-3564-4030-a231-303730653437/29ccdc586e9e961ab1fafab9ee9a095c.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/707601346442-sosiska-v-teste'),
(80,5,'Пирожок с курицей и сыром',55,'шт.','Выпечка','','https://static.tildacdn.com/stor6661-3466-4338-b033-333138363163/c8952bb9a65ff89fbbc2176332c4c9f6.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/496321299492-pirozhok-s-kuritsei-i-sirom'),
(81,5,'Пирожок с вишней',55,'шт.','Выпечка','','https://static.tildacdn.com/stor6339-6262-4634-b133-666338326462/d55190dab4821cf7e6616f363b61e2df.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/556136088862-pirozhok-s-vishnei'),
(82,5,'Слойка с орехом и кленовым сиропом',85,'шт.','Выпечка','','https://static.tildacdn.com/stor3065-3133-4166-a639-306562626438/135f47b919608713243e0598464f858b.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/691143445252-sloika-s-orehom-i-klenovim-siropom'),
(83,5,'Слойка с заварным фисташковым кремом',95,'шт.','Выпечка','','https://static.tildacdn.com/stor3065-6661-4132-b830-363538303539/407187b223a5f8846f1a7336538b97e3.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/229184635762-sloika-s-zavarnim-fistashkovim-kremom'),
(84,5,'Слойка манго-маракуйя',90,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/294112110562-sloika-mango-marakuiya'),
(85,5,'Слойка с яблоком',90,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/516505957692-sloika-s-yablokom'),
(86,5,'Слойка с ветчиной',135,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/978754990492-sloika-s-vetchinoi'),
(87,5,'Слойка с сыром',150,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/680206677002-sloika-s-sirom'),
(88,5,'Слойка с курицей',85,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/998506566312-sloika-s-kuritsei'),
(89,5,'Пирожок с яблоком',55,'шт.','Выпечка','','https://static.tildacdn.com/stor6639-6336-4566-b937-383530326235/2c2f3c6b82153c71c41eff81fa30fa1d.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/924247868962-pirozhok-s-yablokom'),
(90,5,'Ватрушка Царская',150,'шт.','Выпечка','','https://static.tildacdn.com/stor3563-3763-4064-b734-313133356465/814b3ff101e86534e7d68fba1209b128.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/530037445472-vatrushka-tsarskaya'),
(91,5,'Ромовая баба',135,'шт.','Выпечка','','https://static.tildacdn.com/stor3130-3362-4234-b031-366335353132/159957dff186e6ba9ba20d343df0372b.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/567310657622-romovaya-baba'),
(92,5,'Плюшка с сахаром',55,'шт.','Выпечка','','https://static.tildacdn.com/stor3132-6466-4232-b639-663061663763/4bd8b0ee55a28bd52bc1d8c4ee1d4296.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/486042834662-plyushka-s-saharom'),
(93,5,'Плюшка с маком',55,'шт.','Выпечка','','https://static.tildacdn.com/stor6163-6132-4231-b962-656265623939/ebb0a8202356b3d51098ea01cf4e13a0.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/708768409322-plyushka-s-makom'),
(94,5,'Брусничный фреш кусочек',130,'шт.','Выпечка','','https://static.tildacdn.com/stor3532-3132-4565-b632-376265343338/37b99acba1768d049c272aac08be0569.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/427455481152-brusnichnii-fresh-kusochek'),
(95,5,'Маковый пирог с орехом',650,'шт.','Выпечка','','https://static.tildacdn.com/stor6432-6539-4262-b332-613461366362/9c0a04fb0bc36b31c5683f3ef871ec4a.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/265556260652-makovii-pirog-s-orehom'),
(96,5,'Круассан франжепан',200,'шт.','Выпечка','','https://static.tildacdn.com/stor6231-3739-4138-a336-343632313362/96b02cfe7c20bd6850aa406e81990ffe.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/732981620752-kruassan-franzhepan'),
(97,5,'Булочка с ягодой',55,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/435628255722-bulochka-s-yagodoi'),
(98,5,'Чебурек с мясом',120,'шт.','Выпечка','','https://static.tildacdn.com/stor3636-6330-4634-b562-386265346666/ab4f30009e883ea489a681f8718761e8.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/141473877032-cheburek-s-myasom'),
(99,5,'Самса с курицей',85,'шт.','Выпечка','','https://static.tildacdn.com/stor6534-6362-4066-a465-393066376364/64836bab9caad462a20ea98e9e78a019.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/389257735192-samsa-s-kuritsei'),
(100,5,'Пирожок жареный с сыром',65,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/361007576542-pirozhok-zharenii-s-sirom'),
(101,5,'Слойка с ветчиной и сыром',135,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/144347758972-sloika-s-vetchinoi-i-sirom'),
(102,5,'Пицца «Цезарь» (целая)',600,'шт.','Выпечка','','https://static.tildacdn.com/stor3261-3966-4432-b366-363330323564/d5ec446806401eceaeec62e8c72f290f.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/138325138102-pitstsa-tsezar-tselaya'),
(103,5,'Пицца с ветчиной и грибами (целая)',600,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/393678603692-pitstsa-s-vetchinoi-i-gribami-tselaya'),
(104,5,'Пицца с беконом (целая)',600,'шт.','Выпечка','','https://static.tildacdn.com/stor3333-6330-4438-a632-633030366232/00a5366811bca9dd3cfee5c4c1f556f2.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/611838275752-pitstsa-s-bekonom-tselaya'),
(105,5,'Пицца с сыром (целая)',680,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/669997309992-pitstsa-s-sirom-tselaya'),
(106,5,'Пицца с грибами и оливками (целая)',520,'шт.','Выпечка','','https://static.tildacdn.com/stor3565-3239-4539-b538-666263613033/d2fbca9c4d4f5207296e66775177a08a.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/916083138672-pitstsa-s-gribami-i-olivkami-tselaya'),
(107,5,'Пицца «Пепперони» (целая)',600,'шт.','Выпечка','','https://static.tildacdn.com/stor3635-3964-4161-a664-663566306661/cf8f6bfce0ef6535d235fd412050c18e.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/975266956262-pitstsa-pepperoni-tselaya'),
(108,5,'Мини-пицца',95,'шт.','Выпечка','','https://static.tildacdn.com/stor3066-6539-4838-a562-376164626439/a6db4f4487516f4349d1730113af0bfc.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/460663528862-mini-pitstsa'),
(109,5,'Пирог с капустой (целый)',560,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/921761172972-pirog-s-kapustoi-tselii'),
(110,5,'Пирог с мясом (целый)',680,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/104103291702-pirog-s-myasom-tselii'),
(111,5,'Пирог с семгой и рисом (целый)',720,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/909563477052-pirog-s-semgoi-i-risom-tselii'),
(112,5,'Пирог с картофелем и грибами (целый)',680,'шт.','Выпечка','','https://static.tildacdn.com/stor6439-3034-4232-b662-353133316339/c7665b344bb0ac9c466be9eb6d929314.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/976872257612-pirog-s-kartofelem-i-gribami-tselii'),
(113,5,'Пирог с адыгейским сыром (целый)',680,'шт.','Выпечка','','https://static.tildacdn.com/stor3861-3331-4235-a534-353438643561/2cf965a9e5f2db0c449f4c7b20d7c325.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/572899633212-pirog-s-adigeiskim-sirom-tselii'),
(114,5,'Пирог с курицей и сыром (целый)',720,'шт.','Выпечка','',NULL,'https://khlebnyi-dvorik.ru/catalog/tproduct/562324760312-pirog-s-kuritsei-i-sirom-tselii'),
(115,5,'Курник «Жульен»',135,'шт.','Выпечка','','https://static.tildacdn.com/stor3530-6263-4361-a461-623863626363/dcb9f4ade20fa1890933fd125c85bb1d.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/891379946352-kurnik-zhulen'),
(116,5,'Курник с семгой',135,'шт.','Выпечка','','https://static.tildacdn.com/stor3937-6232-4339-a330-393935316131/a6f9199fb943cb792ef944f758019a80.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/510982183872-kurnik-s-semgoi'),
(117,5,'Торт "Молочная девочка"',1500,'кг','Торты','','https://static.tildacdn.com/stor3161-3862-4363-a366-353836386231/2178fe5fe7e0078f1f3ada5dc36f2e28.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/787682144712-tort-molochnaya-devochka'),
(118,5,'Хлеб цельнозерновой',75,'шт.','Хлеб','','https://static.tildacdn.com/stor6230-3135-4865-b538-623035313630/9420d092010d50dad35a4c047c344548.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/325049158632-hleb-tselnozernovoi'),
(119,5,'Панини с курицей',160,'шт.','Завтраки','','https://static.tildacdn.com/stor6261-6433-4566-a165-353234306565/1b78d3b20adb6bdb3d730106ae29e2bf.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/843831849112-panini-s-kuritsei'),
(120,5,'Пельмени',300,'кг','Замороженная продукция','','https://static.tildacdn.com/stor6332-3335-4439-b438-336563336333/a2a9341eacd0c23e38b98f2088963fa6.webp','https://khlebnyi-dvorik.ru/catalog/tproduct/627998812632-pelmeni')
ON CONFLICT (id) DO UPDATE SET shop_id=EXCLUDED.shop_id, name=EXCLUDED.name, price_rub=EXCLUDED.price_rub, unit=EXCLUDED.unit, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, source_url=EXCLUDED.source_url;


-- Replace placeholder/fabricated image paths with original image URLs from official product page metadata.
UPDATE products SET image_url = CASE id
WHEN 20 THEN 'https://static.tildacdn.com/stor6662-3238-4062-b838-313430323033/782618be9668b430d8b9e661daf7793e.webp'
WHEN 21 THEN 'https://static.tildacdn.com/stor3139-6463-4363-a436-633937623961/376c2508eaa22ee4474b2d2a4753a68e.webp'
WHEN 22 THEN 'https://static.tildacdn.com/stor3565-3565-4630-b330-346632356566/687731169dc884d5b34ea68efa1c07fa.webp'
WHEN 23 THEN 'https://static.tildacdn.com/stor3137-6436-4938-a335-303762623661/e83cd909325a8225c39b8205ff04315b.webp'
WHEN 24 THEN 'https://static.tildacdn.com/stor6433-6665-4137-a539-396230386163/3ee95011ff4683da8df20a8ac4365040.webp'
WHEN 25 THEN 'https://static.tildacdn.com/stor6135-3862-4761-b531-656238633036/9f90d8401795eae87ca08d3d9693d57b.webp'
WHEN 26 THEN 'https://static.tildacdn.com/stor3636-3362-4566-b231-636633393839/67d897a9c634f92bc2f9a0b48c2ceb1a.webp'
WHEN 27 THEN 'https://static.tildacdn.com/stor6332-6362-4166-a130-643836383739/a23eb424fe981cbf3b96fd552ed766a9.webp'
WHEN 28 THEN 'https://static.tildacdn.com/stor3862-3761-4138-a635-366161303862/21275ec6c5e193ba1283d07dc5d9ad8e.webp'
WHEN 29 THEN 'https://static.tildacdn.com/stor3063-3561-4665-a265-353737343832/5ee71f77a930b94dd0d5b9c62c155533.webp'
WHEN 30 THEN 'https://static.tildacdn.com/stor3532-6265-4339-b461-306335343031/8720671c2fbdb6ec488b1808657af851.webp'
WHEN 31 THEN 'https://static.tildacdn.com/stor6465-3065-4665-a235-353034326235/55f6bc19f24b93f450bfab94293a9a35.webp'
WHEN 32 THEN 'https://static.tildacdn.com/stor3437-3062-4339-a434-356334326230/84c8a41fa0ef225b4b9d130eb70ef28b.webp'
WHEN 33 THEN 'https://static.tildacdn.com/stor3463-3365-4533-b064-323330316161/9441ebcb9b2474e19ac9fc71ce2b5453.webp'
WHEN 34 THEN 'https://static.tildacdn.com/stor3964-3966-4164-b230-303861643731/495d1604870a4d198865ac5f56a20760.webp'
WHEN 35 THEN 'https://static.tildacdn.com/stor6266-3331-4264-a634-613434386131/17d128dc41c1f9215d7d54b664c5f0e9.webp'
WHEN 36 THEN 'https://static.tildacdn.com/stor3665-3937-4462-b638-633934373763/135da69d9146041652d0c774bb510f7b.webp'
WHEN 37 THEN 'https://static.tildacdn.com/stor6232-3234-4233-b233-353033646339/ceabdacce25ed2780c4cf4aba3dd3ec5.webp'
WHEN 38 THEN 'https://static.tildacdn.com/stor6433-6364-4633-b561-306536353930/f86cfeb3acde4acda649778833c202fb.webp'
WHEN 39 THEN NULL
WHEN 40 THEN 'https://static.tildacdn.com/stor3439-6361-4336-a161-336532383462/19800d92d04a2844bf0754e9028f554d.webp'
WHEN 41 THEN 'https://static.tildacdn.com/stor6330-6335-4566-b532-316439646466/c3e3dc3208f65d4ca9d561843d58425b.webp'
WHEN 42 THEN 'https://static.tildacdn.com/stor3930-3033-4431-b962-303432656239/1ae2d9388d7e21e3fda434f24767ff60.webp'
WHEN 43 THEN 'https://static.tildacdn.com/stor6531-6432-4331-a334-613037316561/1c20f82fe594983842d0f542db503876.webp'
WHEN 44 THEN 'https://static.tildacdn.com/stor6531-3166-4262-b665-643062336135/7963bc3243a64df2633bf1f642a897f5.webp'
WHEN 45 THEN 'https://static.tildacdn.com/stor3161-3430-4737-a534-376232396333/38b15f0a9578c77e5450a8db5da94f74.webp'
WHEN 46 THEN NULL
WHEN 47 THEN 'https://static.tildacdn.com/stor3337-3962-4562-a466-636362613439/44fb2d0bc13746a0fae19442ff4edc4d.webp'
WHEN 48 THEN 'https://static.tildacdn.com/stor6236-3736-4261-b536-646534326539/17ac0d386e2d6c315f467c4008bc121d.webp'
WHEN 49 THEN 'https://static.tildacdn.com/stor6230-3666-4435-b933-383763616138/c8b8934fa597c3ecd73cca9d2f3c7dc9.webp'
WHEN 50 THEN 'https://static.tildacdn.com/stor6338-6239-4236-b839-363034356563/fa8f1ca3a866625968012c47f048e109.webp'
WHEN 51 THEN 'https://static.tildacdn.com/stor3634-3633-4963-b434-636562343130/1a39339b15b50c97386c533c657bb4eb.webp'
WHEN 52 THEN 'https://static.tildacdn.com/stor3234-3135-4735-b665-333439616433/4d410221389a1e0527d80aac20c92567.webp'
WHEN 53 THEN 'https://static.tildacdn.com/stor6439-3933-4632-b762-386331393933/4a59cb6564290ebb0cc6841b305c76bc.webp'
WHEN 54 THEN 'https://static.tildacdn.com/stor6435-3131-4130-a637-356333643235/f021e249a40f4933378d9e72f89d9eb9.webp'
WHEN 55 THEN 'https://static.tildacdn.com/stor6538-6431-4235-b064-356433633936/b948f1f290b9fe2ddb6bda396bb0ac1d.webp'
WHEN 56 THEN 'https://static.tildacdn.com/stor3835-3935-4139-a462-376366343231/24a3320366c0b9afe9a3112c32fedb09.webp'
WHEN 57 THEN 'https://static.tildacdn.com/stor6566-3933-4266-b261-653334623730/602cbb86f95e5b467b2e873d986915ba.webp'
WHEN 58 THEN 'https://static.tildacdn.com/stor3639-3339-4036-b461-663539316536/750f814920dd5117c3b6afef02f79f30.webp'
WHEN 59 THEN 'https://static.tildacdn.com/stor3738-3565-4565-a138-633436646135/d1b3de94e9530b9a6178dd8564d2206e.webp'
WHEN 60 THEN 'https://static.tildacdn.com/stor3630-6137-4633-b034-383337643331/c393975ba61f6c31468f02c0b00d11a4.webp'
WHEN 61 THEN NULL
WHEN 62 THEN 'https://static.tildacdn.com/stor3438-3038-4463-b938-343866626562/787d53fb735f88d10a7dcf85a2917a87.webp'
WHEN 63 THEN 'https://static.tildacdn.com/stor3631-3564-4636-b531-306430656636/993f4327862e096aed76fd03409ed83c.webp'
WHEN 64 THEN 'https://static.tildacdn.com/stor6663-3036-4438-b561-633033363138/244ede7c066bd991241b3fc32e2224cc.webp'
WHEN 65 THEN 'https://static.tildacdn.com/stor3564-6663-4563-b564-623136373131/5de052c7cb68cc0fdbfd40bd251506fa.webp'
WHEN 66 THEN 'https://static.tildacdn.com/stor6133-3431-4038-b561-643831313835/e6a8350f7d6f3195fe5cf6e792ca5f2b.webp'
WHEN 67 THEN 'https://static.tildacdn.com/stor3933-6165-4535-b466-336632623333/3df5f6111169b2b6ce1bebe2ee07d390.webp'
WHEN 68 THEN 'https://static.tildacdn.com/stor3065-3261-4562-b530-353266376135/bab59d2abbd540fc94407087c0700fe6.webp'
WHEN 84 THEN NULL
WHEN 85 THEN 'https://static.tildacdn.com/stor6162-3762-4738-a536-653064653532/056f437277214ef158d7f5a19fb13fa0.webp'
WHEN 85 THEN NULL
WHEN 86 THEN NULL
WHEN 87 THEN NULL
WHEN 88 THEN NULL
WHEN 97 THEN NULL
WHEN 100 THEN NULL
WHEN 101 THEN NULL
WHEN 103 THEN NULL
WHEN 105 THEN NULL
WHEN 109 THEN NULL
WHEN 110 THEN NULL
WHEN 111 THEN NULL
WHEN 114 THEN NULL
ELSE image_url END
WHERE id IN (20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,84,85,86,87,88,97,100,101,103,105,109,110,111,114);

-- One verified real photo found in the merchant's gallery for ham pastry.
UPDATE products
SET image_url = 'https://images.delivery-club.com/ol-images/1280x960/621b538227393a981d5c0381.jpg'
WHERE id = 86 AND shop_id = 5;

-- Pharmacy delivery remains disabled until legal and partner checks are completed.
UPDATE shops SET is_active = FALSE WHERE id = 3;
UPDATE products SET is_active = FALSE WHERE shop_id = 3;


CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Tim-Tim partner/store directory imported from the owner's Yandex Maps links.
-- Prices and product catalogues are intentionally not fabricated; each new store
-- is listed with a clear "catalogue and prices are being confirmed" description.
INSERT INTO shops (id, name, category, description, address, website, maps_url, image_url) VALUES
  (7, 'Rostic''s', 'Рестораны', 'Ресторан быстрого питания. Меню и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Пролетарская, 156', 'https://rostics.ru/', 'https://yandex.ru/maps/-/CXCnABKx', 'https://avatars.mds.yandex.net/get-altay/19707167/2a0000019dd955f81be1ab093285ba87113a/L_height'),
  (8, 'Perlin''s Pita', 'Рестораны', 'Пита, кафе и блюда на вынос. Меню и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Интернациональная, 18', 'http://pita23.ru/', 'https://yandex.ru/maps/-/CXCnA817', 'https://avatars.mds.yandex.net/get-altay/4336337/2a000001794325902640c6758578e74ca145/L_height'),
  (9, 'Пятёрочка', 'Продукты', 'Супермаркет. Ассортимент и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. 50 лет Октября, 115', 'https://5ka.ru/', 'https://yandex.ru/maps/-/CXCnA2la', 'https://avatars.mds.yandex.net/get-altay/1870294/2a0000017015a11fada6dfc3f6b7e228f69d/L_height'),
  (10, 'Магнит', 'Продукты', 'Супермаркет. Ассортимент и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Котляра, 195', 'https://magnit.ru/', 'https://yandex.ru/maps/-/CXCnEY6N', 'https://avatars.mds.yandex.net/get-altay/16415892/2a0000019ef83a31dc59dfcd748230a75dda/L_height'),
  (11, 'Поворот', 'Стройматериалы', 'Гипермаркет строительных и хозяйственных товаров. Наличие и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Пролетарская, 180А', 'https://povorot-proletarskaja-ulitsa.clients.site/', 'https://yandex.ru/maps/-/CXCnE0Oj', 'https://avatars.mds.yandex.net/get-altay/1032555/2a000001875b4bebc888bf01582ec26d106e/L_height'),
  (12, 'Ёбидоёби', 'Рестораны', 'Суши-бар. Меню и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, Советский пер., 18', 'https://timashevsk.yobidoyobi.ru/', 'https://yandex.ru/maps/-/CXCnE2Je', 'https://avatars.mds.yandex.net/get-altay/21148955/2a000001a0006fd520db0316ad1512747453/L_height'),
  (13, 'Шустрый Краб', 'Рестораны', 'Кафе и блюда из морепродуктов. Меню и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Пролетарская, 114', NULL, 'https://yandex.ru/maps/-/CXCnIIy5', 'https://avatars.mds.yandex.net/get-altay/5482016/2a0000017d8f041fcd403d29273ed223ec35/L_height'),
  (14, 'М.Косметик', 'Косметика', 'Парфюмерия, косметика и товары для ухода. Ассортимент и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Ленина, 128', 'https://cosmetic.magnit.ru/', 'https://yandex.ru/maps/-/CXCnIY7g', 'https://avatars.mds.yandex.net/get-altay/3986135/2a0000017949cdfde6b39e19de83c40d3f8e/L_height'),
  (15, 'Додо Пицца', 'Рестораны', 'Пиццерия. Меню и цены уточняются перед подтверждением заказа.', 'г. Тимашевск, ул. Красная, 104', 'https://dodopizza.ru/', 'https://yandex.ru/maps/-/CXCnMS5T', 'https://avatars.mds.yandex.net/get-altay/13083354/2a00000191569dfe630a046ceb6e72592bf8/L_height')
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  address=EXCLUDED.address, website=EXCLUDED.website, maps_url=EXCLUDED.maps_url,
  image_url=EXCLUDED.image_url;


-- Verified starter menu for the Timashevsk Yobidoyobi branch.
-- Names, weights, prices and images were read from its official live menu on 2026-11-11.
INSERT INTO products (id, shop_id, name, price_rub, unit, category, description, image_url, source_url) VALUES
(115,12,'Гранд Суши Тако Бокс',2459,'1850 г','Наборы','Суши-тако с лососем, беконом и крабом, сливочная кола.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/04ed28ce-2eaa-4e6a-a98e-3c9eddc1915c/fc6c9d1e-1b53-49db-930e-779df71e3d10.webp','https://timashevsk.yobidoyobi.ru/'),
(116,12,'Atomic Heart',1699,'1195 г','Наборы','Сет роллов: Лава Эби, Филадельфия Лосось Лайт, Калифорния и запечённые Аяши.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/e4da23bf-2bd6-42a1-b349-82ab9610d08e/c421f0b9-d97b-41ae-8d34-beb6d455fce9.webp','https://timashevsk.yobidoyobi.ru/'),
(117,12,'Большой БиЧ',1799,'1415 г','Наборы','Состав сета: Краб терияки, Филадельфия лосось лайт, Цезарь, Калифорния, Лава темпура и Цезарь темпура.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/d5cb0261-98fd-4505-b6fe-5c611c0c1450/d660091c-ef55-4b69-91f5-22e199b95052.webp','https://timashevsk.yobidoyobi.ru/'),
(118,12,'Филадельфия с огурцом',879,'295 г','Роллы и суши','Ролл с лососем, сливочным сыром и огурцом.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/81c8ca42-a187-464d-807e-fb97c966aff4/e93ec9a1-0027-4db9-83e4-ddea6188e182.webp','https://timashevsk.yobidoyobi.ru/'),
(119,12,'Калифорния',389,'215 г','Роллы и суши','Ролл Калифорния. Состав и наличие уточняйте в официальном меню.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/93e42547-a43d-4029-87e3-b252ce34b148/aeecfa49-b203-4a2e-a81d-63c24b603835.webp','https://timashevsk.yobidoyobi.ru/'),
(120,12,'Цезарь запечённый с курицей',249,'250 г','Запечённые','Запечённый ролл с курицей.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/4f3061ff-3d31-47d2-a3f7-9d2df2569ab6/64fc5237-56be-4461-adbf-cbcd9806fd4c.webp','https://timashevsk.yobidoyobi.ru/'),
(121,12,'Сливочная кола Ёбидоёби',129,'330 г','Напитки и десерты','Фирменный напиток.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/3673c9da-429c-441d-94fc-2d9fc95e7252/3c851ffd-fc61-4bb0-89bc-77216b81dd3f.webp','https://timashevsk.yobidoyobi.ru/'),
(122,12,'Чизкейк New York',309,'100 г','Напитки и десерты','Чизкейк New York.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/c54038c2-d3f4-47db-aba4-1528cfbb264a/b9050a2f-7c97-4fe1-acea-2371c0c60bce.webp','https://timashevsk.yobidoyobi.ru/'),
(123,12,'Соус Терияки',79,'30 г','Соусы','Соус Терияки.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/a10c02f5-4f8f-481b-bd0e-a95188ef153b/54dbe4be-44fc-4c52-9269-00b0926189df.webp','https://timashevsk.yobidoyobi.ru/')
ON CONFLICT (id) DO UPDATE SET
 shop_id=EXCLUDED.shop_id,name=EXCLUDED.name,price_rub=EXCLUDED.price_rub,unit=EXCLUDED.unit,
 category=EXCLUDED.category,description=EXCLUDED.description,image_url=EXCLUDED.image_url,
 source_url=EXCLUDED.source_url,is_active=TRUE,updated_at=NOW();


-- Additional 22 live-menu items from the official Timashevsk Ёбидоёби menu.
-- Prices and portions were checked in the merchant's online menu on 2026-11-11.
INSERT INTO products (id, shop_id, name, price_rub, unit, category, description, image_url, source_url) VALUES
(124,12,'Фреш рап в кляре',319,'230 г','Новинки','Жареная курица, тортилья, салат, помидор, соус Цезарь, сыр, кляр и панировочные сухари.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/34f62471-d5f1-421f-a03b-797bc26180fc/542b919e-9852-4431-b3e7-692a830b5184.webp','https://timashevsk.yobidoyobi.ru/'),
(125,12,'Четыре сыра',239,'230 г','Новинки','Сливочный сыр, сырный соус, чеддер, дорблю и кунжут.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/cc802ce4-1a36-4b03-8851-ddba59fa7928/4ece89c6-4784-43a9-a594-a83c506bc054.webp','https://timashevsk.yobidoyobi.ru/'),
(126,12,'Калифорния Дорблю',389,'245 г','Новинки','Снежный краб, тамаго, сливочный сыр, масаго, дорблю и соус унаги.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/0701b525-87e3-46db-b2eb-356e645e0ae1/08d6b492-8a37-4f71-a6bb-38cb37c1e609.webp','https://timashevsk.yobidoyobi.ru/'),
(127,12,'Ролломёт Шримп Том Ям',499,'280 г','Новинки','Креветка темпура, огурец, сливочный сыр, соус том ям и красная масаго.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/5a36253f-9523-411a-a67a-5e20833b7330/daf3394f-f22b-4a7e-a466-0a0c9827eb27.webp','https://timashevsk.yobidoyobi.ru/'),
(128,12,'Ролломёт Калифорния',499,'240 г','Новинки','Снежный краб, майонез, огурец, оранжевая масаго и соусник с соевым соусом.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/b51336ff-a5ac-4c7a-85a6-76c1c8d2d0ce/d7b8cb65-4c5f-4557-a37d-1732de7f0619.webp','https://timashevsk.yobidoyobi.ru/'),
(129,12,'Ролломёт Филадельфия',899,'290 г','Новинки','Слабосолёный лосось, сливочный сыр, огурец и соевый соус в комплекте.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/a046db36-9921-44a9-8dbe-0e3d048e8375/3bc4cb53-ea55-4123-a326-abf343bd2f17.webp','https://timashevsk.yobidoyobi.ru/'),
(130,12,'Ёбокс мини корн-доги',399,'135 г','Комбо','Мини-набор с корн-догами. На позицию не распространяются акции, скидки и промокоды.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/e609434b-34a2-43ee-beba-fc34ce558651/87aaf7ad-5eae-4587-8b1f-1ee12280a11a.webp','https://timashevsk.yobidoyobi.ru/'),
(131,12,'Ёбокс мини',369,'135 г','Комбо','Ролл Эби темпура (4 шт.), ролл Цезарь BIG (4 шт.) и палочки для суши.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/894c5c15-8a8c-4e7b-9992-67476dc18c63/afa94362-ef4f-476b-a121-7497e39e47f2.webp','https://timashevsk.yobidoyobi.ru/'),
(132,12,'Ёбокс микс',469,'235 г','Комбо','Ролл Краб темпура (4 шт.), ролл Цезарь (4 шт.) и палочки для суши.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/8896c939-2df3-496b-a113-50cc35b51336/26d9cbe6-549f-4dcb-ab5a-59505cc6ba70.webp','https://timashevsk.yobidoyobi.ru/'),
(133,12,'Ёнигири лосось терияки',169,'140 г','Ёнигири','Лосось, сливочный сыр и рис.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/2c725d18-633c-44be-ae18-e0e20fdd0e74/6f200f3c-4b98-435a-bb78-a869fa68e767.webp','https://timashevsk.yobidoyobi.ru/'),
(134,12,'Ёнигири с крабом',169,'140 г','Ёнигири','Снежный краб, икра масаго, рис и нори.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/3843b89c-af82-46ce-9b9d-b9ad287eb7d5/83f494c3-ea35-48bf-a00d-06f632352943.webp','https://timashevsk.yobidoyobi.ru/'),
(135,12,'Лосось чили-майо темпура',399,'230 г','Темпура','Лосось, огурец, помидор, кляр, панировочные сухари и соус чили-майо.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/ab94b1f7-3db2-4d66-94d5-871abc07e5a0/27bd3b80-5ce3-4ee7-bc09-73be81c9c9f3.webp','https://timashevsk.yobidoyobi.ru/'),
(136,12,'Эби темпура',365,'185 г','Темпура','Рис, нори, сливочный сыр, креветка, майонез и паста кимчи.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/18165d8f-82f4-4a9f-b81c-b004052a8161/8a159694-abc6-432e-8de1-2c6a4a00b941.webp','https://timashevsk.yobidoyobi.ru/'),
(137,12,'Чикен темпура',349,'250 г','Темпура','Куриное филе, сливочный сыр, майонез и паста кимчи в темпуре.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/ab97af36-0d11-4531-be50-a9a7ad62448b/92806a08-169f-4fa7-887d-7dfd7c9c6c1c.webp','https://timashevsk.yobidoyobi.ru/'),
(138,12,'Четыре сыра (запечённый)',239,'230 г','Горячее и салаты','Сливочный сыр, сырный соус, чеддер, дорблю и кунжут.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/12798bbe-3342-4592-aca7-c922316c3bc4/046c5964-0beb-4957-859e-80495b3c9b60.webp','https://timashevsk.yobidoyobi.ru/'),
(139,12,'Аяши с угрём',349,'240 г','Горячее и салаты','Угорь, краб, моцарелла, масаго и соус унаги.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/58d0a896-68d9-4496-b667-22029450487b.webp','https://timashevsk.yobidoyobi.ru/'),
(140,12,'Аяши с копчёным лососем',359,'250 г','Горячее и салаты','Копчёный лосось, сливочный сыр, зелёный лук и огурец.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec.webp','https://timashevsk.yobidoyobi.ru/'),
(141,12,'Поке с лососем + 1 соус',429,'260 г','Горячее и салаты','Рис, лосось и соус на выбор.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/d77a5979-86c0-4be3-a05c-d93befbc8eab.webp','https://timashevsk.yobidoyobi.ru/'),
(142,12,'Байтсы',199,'135 г','Закуски','Порция байтсов. Возможны следы аллергенов на кухне ресторана.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/cfe248c5-1e62-421e-9173-e6ed2630bc89.webp','https://timashevsk.yobidoyobi.ru/'),
(143,12,'Корн-доги',189,'145 г','Закуски','Порция корн-догов. Возможны следы аллергенов на кухне ресторана.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/705863f0-8772-456b-873f-f9b736b37f0d.webp','https://timashevsk.yobidoyobi.ru/'),
(144,12,'Наггетсы',179,'115 г','Закуски','Порция наггетсов. Возможны следы аллергенов на кухне ресторана.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/6f83de1b-c41b-49ff-99e0-0efc9a26e16b.webp','https://timashevsk.yobidoyobi.ru/'),
(145,12,'Стрипсы',219,'200 г','Закуски','Порция куриных стрипсов. Возможны следы аллергенов на кухне ресторана.','https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/83f494c3-ea55-48bf-a00d-06f632352943.webp','https://timashevsk.yobidoyobi.ru/')
ON CONFLICT (id) DO UPDATE SET shop_id=EXCLUDED.shop_id,name=EXCLUDED.name,price_rub=EXCLUDED.price_rub,
 unit=EXCLUDED.unit,category=EXCLUDED.category,description=EXCLUDED.description,image_url=EXCLUDED.image_url,
 source_url=EXCLUDED.source_url,is_active=TRUE,updated_at=NOW();

UPDATE products SET price_rub=149,
 image_url='https://imgr.yobidoyobi.ru/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/menu/26d9cbe6-549f-4dcb-ab5a-59505cc6ba70.webp'
WHERE id=121 AND shop_id=12;

UPDATE shops SET maps_url='https://yandex.ru/maps/-/CXCnAGyX'
WHERE id=5;
UPDATE shops SET phone='+7 989 849-99-55' WHERE id=5 AND phone IS NULL;
UPDATE shops SET maps_url='https://yandex.ru/maps/-/CXCnEK5L'
WHERE id=6;
UPDATE shops SET phone='+7 918 918-50-00' WHERE id=8;
UPDATE shops SET phone='+7 861 304-40-23' WHERE id=11;
UPDATE shops SET phone='8 800 333-33-23' WHERE id=12;


-- Official product photo confirmed on the merchant's product page.
UPDATE products SET image_url='https://static.tildacdn.com/stor6162-3762-4738-a536-653064653532/056f437277214ef158d7f5a19fb13fa0.webp' WHERE id=85 AND shop_id=5;
