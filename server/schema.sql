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

-- Pharmacy delivery remains disabled until legal and partner checks are completed.
UPDATE shops SET is_active = FALSE WHERE id = 3;
UPDATE products SET is_active = FALSE WHERE shop_id = 3;
