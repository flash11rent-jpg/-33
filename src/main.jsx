import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Store, Truck, UserRound, X } from "lucide-react";
import "./style.css";
const shops=[
{id:1,name:"Продукты у дома",category:"Продукты",icon:"🛒",time:"30–45 мин",description:"Всё необходимое на каждый день"},
{id:2,name:"Цветочный мир",category:"Цветы",icon:"💐",time:"40–60 мин",description:"Букеты и цветы для близких"},
{id:4,name:"Дом и уют",category:"Для дома",icon:"🏡",time:"40–60 мин",description:"Полезные мелочи для дома"},
{id:6,name:"Мастер",category:"Стройматериалы",icon:"🛠️",time:"40–60 мин",description:"Строительные материалы, инструменты и товары для ремонта"}];
const productIcons={1:"🥛",2:"🍞",3:"🥚",4:"🍌",5:"🧀",6:"💐",7:"🌼",8:"🌷",10:"🧽",11:"🧻"};
const shopCategoryFallback=[
 {name:"Продукты",emoji:"🥑",category_type:"shop",sort_order:10},
 {name:"Выпечка",emoji:"🥐",category_type:"shop",sort_order:20},
 {name:"Цветы",emoji:"💐",category_type:"shop",sort_order:30},
 {name:"Для дома",emoji:"🪴",category_type:"shop",sort_order:40},
 {name:"Стройматериалы",emoji:"🛠️",category_type:"shop",sort_order:50},
 {name:"Рестораны",emoji:"🍽️",category_type:"shop",sort_order:60},
 {name:"Косметика",emoji:"💄",category_type:"shop",sort_order:70}
];
const statuses=["Новый","Подтверждён","Собирается","Готов","В пути","Доставлен","Отменён"];
const individualStatuses=["Новая заявка","Проверяется","Согласована","Покупка выполняется","Выполнена","Отменена"];
const money=n=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";
function ShopBrandMark({shop}){
 const id=Number(shop.id), name=shop.name||"", normalized=name.toLocaleLowerCase("ru-RU");
 const brandId=id===7||normalized.includes("rostic")?7:id===9||normalized.includes("пятёроч")||normalized.includes("пятероч")?9:id===10||normalized==="магнит"?10:id===14||normalized.includes("м.косметик")||normalized.includes("магнит косметик")?14:id===15||normalized.includes("додо")?15:null;
 const logos={
  7:"https://logo-teka.com/wp-content/uploads/2025/07/rostics-logo.svg",
  9:"https://logo-teka.com/wp-content/uploads/2025/06/pyaterochka-logo.svg",
  10:"https://www.magnit.com/images/logo/logo--red--ru.svg",
  14:"https://logo-teka.com/wp-content/uploads/2025/06/magnit-cosmetic-logo.svg",
  15:"https://shift.dodobrands.io/images/graphic-design/logo-all-languages/RU.png"
 };
 const themes={7:"rostics",9:"pyaterochka",10:"magnit",14:"mcosmetic",15:"dodo"};
 const labels={7:"ROSTIC'S",9:"ПЯТЁРОЧКА",10:"МАГНИТ",14:"М.КОСМЕТИК",15:"ДОДО ПИЦЦА"};
 const logo=brandId?(shop.logo_url||logos[brandId]):shop.logo_url;
 if(!brandId)return logo?<span className="shop-card-banner shop-card-banner-custom"><span className="shop-card-banner-brand"><img src={logo} alt={name+" — логотип"}/></span></span>:shop.imageUrl?<img className="shop-card-photo" src={shop.imageUrl} alt={name+" — изображение магазина"} loading="lazy"/>:null;
 return <div className={"shop-card-banner shop-card-banner-"+brandId+" shop-card-banner-"+themes[brandId]} aria-label={labels[brandId]}>
  <span className="shop-card-banner-brand">
   {logo&&<><img src={logo} alt={labels[brandId]+" — логотип"} loading="eager" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement.classList.add("logo-failed")}}/><b className={"shop-card-banner-wordmark shop-card-banner-wordmark-"+brandId}>{labels[brandId]}</b></>}
  </span>
 </div>;
}
function ShopMiniIcon({shop}){
 const id=Number(shop.id);
 const logos={
  7:"https://logo-teka.com/wp-content/uploads/2025/07/rostics-logo.svg",
  8:"https://cdn.foodsoul.ru/zones/ru/chains/6407/images/main/40b41d64c305e11a726fc2dd93cb9876.png?v1692435179",
  9:"https://logo-teka.com/wp-content/uploads/2025/06/pyaterochka-logo.svg",
  10:"https://www.magnit.com/images/logo/logo--red--ru.svg",
  11:"https://avatars.mds.yandex.net/get-maps-adv-crm/11387709/2a00000190021c14742255df868c33ca4569/landing_logo",
  12:"https://storage.yandexcloud.net/yobiweb-storage-prod/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/web/logo_y.svg",
  14:"https://logo-teka.com/wp-content/uploads/2025/06/magnit-cosmetic-logo.svg",
  15:"https://shift.dodobrands.io/images/graphic-design/logo-all-languages/RU.png"
 };
 const src=shop.logo_url||logos[id];
 if(!src&&id<7)return null;
 return <span className={"shop-mini-brand shop-mini-brand-"+id}>
  {src&&<img src={src} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display="none";const f=e.currentTarget.nextElementSibling;if(f)f.style.display="grid"}}/>}
  <span className="shop-mini-brand-fallback">{id===13?"ШК":id===11?"П":"✦"}</span>
 </span>;
}
async function prepareCatalogImage(file,aspectRatio=1) {
 if(!file) return null;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Подойдут фотографии JPG, PNG или WebP.");
 const bitmap=await createImageBitmap(file);
 const sourceRatio=bitmap.width/bitmap.height;
 let sx=0,sy=0,sw=bitmap.width,sh=bitmap.height;
 if(sourceRatio>aspectRatio){sw=bitmap.height*aspectRatio;sx=(bitmap.width-sw)/2}
 else if(sourceRatio<aspectRatio){sh=bitmap.width/aspectRatio;sy=(bitmap.height-sh)/2}
 let scale=Math.min(1,1200/Math.max(sw,sh));
 let blob=null;
 for(let attempt=0;attempt<5;attempt++){
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(sw*scale));
  canvas.height=Math.max(1,Math.round(sh*scale));
  const ctx=canvas.getContext("2d");
  if(!ctx){bitmap.close?.();throw new Error("Не удалось обработать фотографию.")}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.84-attempt*0.06));
  if(blob&&blob.size<=560*1024) break;
  scale*=0.78;
 }
 bitmap.close?.();
 if(!blob||blob.size>560*1024) throw new Error("Фото слишком большое. Попробуйте другое изображение.");
 return await new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result);
  reader.onerror=()=>reject(new Error("Не удалось прочитать фотографию."));
  reader.readAsDataURL(blob);
 });
}

function PhotoPicker({value,onChange,title="Фотография",wide=false,hint="",aspectRatio=1}) {
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function choose(file){
  if(!file)return;
  setBusy(true);setError("");
  try{onChange(await prepareCatalogImage(file,aspectRatio))}
  catch(e){setError(e.message||"Не удалось загрузить фото")}
  finally{setBusy(false)}
 }
 const cropLabel=aspectRatio>1?"16:9":aspectRatio<1?"вертикальный":"1:1";
 return <div className={"admin-photo-picker"+(wide?" wide":"")}>
  <div className="admin-photo-preview" style={{aspectRatio:String(aspectRatio)}}>{value?<img src={value} alt={title+" — итоговая обрезка"}/>:<span>📷</span>}</div>
  <div className="admin-photo-actions">
   <b>{title}</b>
   <small>{hint||"JPG, PNG или WebP. Фото автоматически обрежется по центру под формат "+cropLabel+", уменьшится и сохранится в WebP."}</small>
   <label className="admin-upload-button">{busy?"Обрабатываем…":value?"Заменить фото":"Загрузить фото"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{choose(e.target.files?.[0]);e.target.value=""}}/></label>
   {value&&<button type="button" className="admin-clear-photo" onClick={()=>{setError("");onChange(null)}}>Убрать фото</button>}
   {error&&<small className="admin-photo-error">{error}</small>}
  </div>
 </div>;
}

function shopCountLabel(n){const m=n%10,t=n%100;return t>=11&&t<=14?"мест":m===1?"место":m>=2&&m<=4?"места":"мест"}
function productIconFor(p){const n=(p.name||"").toLowerCase();if(n.includes("пицц"))return "🍕";if(n.includes("пирог")||n.includes("пирож")||n.includes("эклер")||n.includes("трайфл")||n.includes("чизкейк"))return "🍰";if(n.includes("слойк")||n.includes("булоч")||n.includes("хлеб"))return "🥐";if(n.includes("напит")||n.includes("кола"))return "🥤";return "🥐"}
function productSection(p){
 const n=(p.name||"").toLowerCase(), c=(p.category||"").toLowerCase();
 if(n.includes("пицц"))return "Пицца";
 if(n.includes("пирог")||n.includes("штрудель"))return "Пироги";
 if(c.includes("торт")||n.startsWith("торт"))return "Торты";
 if(n.includes("пирожн")||n.includes("эклер")||n.includes("чизкейк")||n.includes("моти")||n.includes("зефир")||n.includes("трайфл")||n.includes("тарт")||n.includes("круассан")||n.includes("павлов")||n.includes("трубоч")||n.includes("корзинк")||n.includes("кольцо с белковым")||n.includes("чиа"))return "Сладкое";
 if(c.includes("напит"))return "Напитки и десерты";
 if(c.includes("десерт"))return "Сладкое";
 if(c.includes("хлеб")||n.includes("хлеб"))return "Хлеб";
 if(c.includes("завтрак")||n.includes("панини"))return "Завтраки";
 if(c.includes("кулинар")||n.includes("котлет")||n.includes("голубц"))return "Кулинария";
 if(c.includes("заморож"))return "Заморозка";
 if(c.includes("выпеч"))return "Выпечка";
 if(c.includes("набор"))return "Наборы";
 if(c.includes("комбо"))return "Комбо";
 if(c.includes("новин"))return "Новинки";
 if(c.includes("ролл")||c.includes("суши"))return "Роллы и суши";
 if(c.includes("ёнигири")||c.includes("онигири"))return "Ёнигири";
 if(c.includes("темпура"))return "Темпура";
 if(c.includes("запеч"))return "Запечённые";
 if(c.includes("горячее")||c.includes("салат"))return "Горячее и салаты";
 if(c.includes("закуск"))return "Закуски";
 if(c.includes("напит")||c.includes("десерт"))return "Напитки и десерты";
 if(c.includes("соус")||c.includes("спец"))return "Соусы";
 return p.category||"Другое";
}
function CroissantFloat({className}){const gradientId="gold-"+className;return <span className={"bakery-croissant "+className}><svg viewBox="0 0 180 110" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe4a8"/><stop offset=".48" stopColor="#d98b3d"/><stop offset="1" stopColor="#9c5128"/></linearGradient></defs><path d="M14 76C5 65 12 42 29 26 44 12 60 14 67 27c8 13 19 19 33 18 16-1 28-14 37-25 9-11 24-7 29 6 7 19-6 42-24 56-24 19-50 12-72 2-22-10-41 3-56-8Z" fill={"url(#"+gradientId+")"} stroke="#9b572d" strokeWidth="3"/><path d="M32 34c-7 12-10 24-8 36m27-48c-8 17-10 34-5 51m26-42c-7 17-7 34 0 48m25-30c-5 14-3 28 5 40m23-48c-4 15 0 27 10 37m14-52c-1 12 4 21 13 27" fill="none" stroke="#ffe7b5" strokeWidth="5" strokeLinecap="round" opacity=".72"/><path d="M18 68c8 5 17 4 27-1m93 16c11-7 18-17 20-28" fill="none" stroke="#87451f" strokeWidth="3" strokeLinecap="round" opacity=".5"/></svg></span>}
function PizzaFloat(){return <span className="bakery-food pizza-float"><svg viewBox="0 0 120 110" aria-hidden="true"><path d="M12 18Q61 -1 108 20L62 101Z" fill="#e8ad43" stroke="#a95d2b" strokeWidth="4" strokeLinejoin="round"/><path d="M17 22Q62 5 101 23L62 88Z" fill="#f7d77b"/><path d="M21 27Q62 11 95 27" fill="none" stroke="#b84c32" strokeWidth="8" strokeLinecap="round"/><g fill="#b94b35" stroke="#8f382a" strokeWidth="1.5"><circle cx="48" cy="34" r="7"/><circle cx="77" cy="39" r="7"/><circle cx="59" cy="60" r="7"/></g><g fill="#557447"><path d="M35 45q8-10 12 0q-7 8-12 0"/><path d="M79 58q8-10 12 0q-7 8-12 0"/></g><path d="M12 18Q61 -1 108 20" fill="none" stroke="#f8e5a9" strokeWidth="5" strokeLinecap="round"/></svg></span>}
function WheatFloat(){return <span className="bakery-food wheat-float"><svg viewBox="0 0 100 150" aria-hidden="true"><path d="M18 139Q48 87 78 14" fill="none" stroke="#75834a" strokeWidth="5" strokeLinecap="round"/><g fill="#d7ad55" stroke="#a77a35" strokeWidth="1.5"><path d="M68 34Q45 31 47 13Q65 13 68 34Z"/><path d="M59 51Q35 51 36 31Q55 30 59 51Z"/><path d="M51 69Q28 69 29 49Q47 48 51 69Z"/><path d="M43 87Q20 86 21 67Q39 66 43 87Z"/><path d="M75 21Q91 8 91 28Q83 40 75 21Z"/><path d="M67 40Q86 27 85 47Q76 58 67 40Z"/><path d="M59 59Q79 47 77 66Q67 77 59 59Z"/><path d="M51 78Q71 66 69 85Q59 96 51 78Z"/></g></svg></span>}
function BreadFloat(){return <span className="bakery-food bread-float"><svg viewBox="0 0 130 100" aria-hidden="true"><path d="M13 66Q9 34 34 22Q64 3 96 22Q122 37 116 67Q111 88 66 89Q19 89 13 66Z" fill="#c77b39" stroke="#8e4e29" strokeWidth="4"/><path d="M25 57Q28 35 46 28M53 55Q57 29 77 24M82 58Q89 36 104 34" fill="none" stroke="#f5d39a" strokeWidth="9" strokeLinecap="round"/><path d="M17 70Q61 92 112 70" fill="none" stroke="#a85e2f" strokeWidth="4" opacity=".55"/></svg></span>}
function BaguetteFloat(){return <span className="bakery-food baguette-float"><svg viewBox="0 0 150 65" aria-hidden="true"><path d="M10 43Q16 17 45 14L123 8Q144 8 141 28Q137 48 111 51L30 58Q8 59 10 43Z" fill="#d99a4d" stroke="#a96330" strokeWidth="3"/><path d="M39 19L29 42M68 15L58 40M98 12L88 37" stroke="#f8d99e" strokeWidth="7" strokeLinecap="round"/><path d="M15 45Q25 53 43 49" fill="none" stroke="#f4c77f" strokeWidth="3"/></svg></span>}
function PastryFloat(){return <span className="bakery-food pastry-float"><svg viewBox="0 0 120 110" aria-hidden="true"><path d="M20 83Q10 67 26 50L47 22Q60 7 74 22L96 50Q111 69 96 83Z" fill="#d98d43" stroke="#99552d" strokeWidth="4"/><path d="M28 77Q23 65 36 51L54 29Q61 21 68 29L88 53Q99 67 89 78Z" fill="#f3c77e"/><path d="M43 55Q60 37 77 57M38 68Q60 51 82 69" fill="none" stroke="#fff0c9" strokeWidth="6" strokeLinecap="round"/><path d="M26 86Q59 99 94 86" fill="none" stroke="#a65c30" strokeWidth="5" strokeLinecap="round"/><g fill="#fff6df"><circle cx="48" cy="17" r="2"/><circle cx="68" cy="13" r="2"/><circle cx="83" cy="27" r="2"/></g></svg></span>}
const shopSectionOrder=["Новинки","Наборы","Комбо","Роллы и суши","Ёнигири","Темпура","Запечённые","Горячее и салаты","Закуски","Напитки и десерты","Соусы","Сладкое","Выпечка","Пицца","Пироги","Торты","Хлеб","Завтраки","Кулинария","Заморозка","Другое"];
const API_URL="https://tim-tim-api.onrender.com";
function App(){
const [page,setPage]=useState("home"),[category,setCategory]=useState("Все"),[query,setQuery]=useState(""),[activeShop,setActiveShop]=useState(null),[selectedProduct,setSelectedProduct]=useState(null),[cart,setCart]=useState([]),[address,setAddress]=useState(""),[apartment,setApartment]=useState(""),[entrance,setEntrance]=useState(""),[floor,setFloor]=useState(""),[phone,setPhone]=useState(""),[comment,setComment]=useState(""),[notice,setNotice]=useState(""),[selectedOrder,setSelectedOrder]=useState(null),[isSubmitting,setIsSubmitting]=useState(false),[adminPassword,setAdminPassword]=useState(""),[adminSession,setAdminSession]=useState(""),[adminAuthenticated,setAdminAuthenticated]=useState(false),[adminOrders,setAdminOrders]=useState([]),[adminError,setAdminError]=useState("");
const [shopSaving,setShopSaving]=useState(false),[productSaving,setProductSaving]=useState(false),[categorySaving,setCategorySaving]=useState(false);
const [house,setHouse]=useState("");
const [individualStore,setIndividualStore]=useState("");
const [individualStoreAddress,setIndividualStoreAddress]=useState("");
const [individualItems,setIndividualItems]=useState("");
const [individualDeliveryAddress,setIndividualDeliveryAddress]=useState("");
const [individualPhone,setIndividualPhone]=useState("");
const [individualComment,setIndividualComment]=useState("");
const [individualSubmitting,setIndividualSubmitting]=useState(false);
const [individualSuccessNumber,setIndividualSuccessNumber]=useState(null);
const [adminIndividualRequests,setAdminIndividualRequests]=useState([]);
const [shopData,setShopData]=useState(shops),[productData,setProductData]=useState([]),[catalogLoading,setCatalogLoading]=useState(true),[productSectionFilter,setProductSectionFilter]=useState("Все");
const [operatorTab,setOperatorTab]=useState("orders"),[adminShops,setAdminShops]=useState([]),[adminProducts,setAdminProducts]=useState([]),[adminCategories,setAdminCategories]=useState([]);
const [shopCategories,setShopCategories]=useState(shopCategoryFallback);
const [editingShopId,setEditingShopId]=useState(null),[shopForm,setShopForm]=useState({name:"",category:"Продукты",description:"",imageUrl:null,logoUrl:null,cardBackground:"#ffffff",website:"",phone:"",address:"",mapsUrl:"",isActive:true});
const [editingProductId,setEditingProductId]=useState(null),[productForm,setProductForm]=useState({shopId:"",name:"",priceRub:"",unit:"шт.",category:"Другое",description:"",imageUrl:null,sourceUrl:"",isActive:true});
const [categoryForm,setCategoryForm]=useState({name:"",categoryType:"product",emoji:"🛍️",imageUrl:null,sortOrder:100});
const [newShopName,setNewShopName]=useState(""),[newShopCategory,setNewShopCategory]=useState("Продукты");
const [newProductShop,setNewProductShop]=useState(""),[newProductName,setNewProductName]=useState(""),[newProductPrice,setNewProductPrice]=useState(""),[newProductUnit,setNewProductUnit]=useState("шт.");
const [brandLogo,setBrandLogo]=useState("");const [logoSaving,setLogoSaving]=useState(false);

useEffect(()=>{let cancelled=false;fetch(API_URL+"/api/brand").then(r=>r.ok?r.json():null).then(d=>{if(!cancelled&&d?.logo)setBrandLogo(d.logo)}).catch(()=>{});return()=>{cancelled=true}},[]);
async function saveBrandLogo(file){if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setAdminError("Выберите PNG, JPG или WebP");return}if(file.size>900*1024){setAdminError("Файл должен быть меньше 900 КБ");return}setLogoSaving(true);try{const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Не удалось прочитать файл"));reader.readAsDataURL(file)});const response=await fetch(API_URL+"/api/admin/brand",{method:"PATCH",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({logo:dataUrl})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить логотип");setBrandLogo(data.logo);setAdminError("")}catch(error){setAdminError(error.message||"Ошибка сохранения логотипа")}finally{setLogoSaving(false)}}
useEffect(()=>{
 let cancelled=false;
 fetch(API_URL+"/api/catalog")
  .then(response=>{if(!response.ok)throw new Error("Каталог временно недоступен");return response.json()})
  .then(data=>{
   if(cancelled)return;
   const nextShops=(data.shops||[]).map(s=>({...s,logo_url:s.logo_url,card_background:s.card_background,icon:shops.find(x=>x.id===s.id)?.icon||({5:"🥐",6:"🛠️",7:"🍗",8:"🥙",9:"🛒",10:"🛍️",11:"🔩",12:"🍣",13:"🦀",14:"💄",15:"🍕"}[s.id]||"🏬"),time:shops.find(x=>x.id===s.id)?.time||"30–60 мин",description:s.description||shops.find(x=>x.id===s.id)?.description||"Товары с доставкой по Тимашевску",imageUrl:s.image_url||(s.id===12?"https://storage.yandexcloud.net/yobiweb-storage-prod/42e3e1d5-084d-4f04-baf2-ff7f695f0ae0/e9bf70c9-f9b4-4a03-9cdc-7e03bb03dcec/web/logo_y.svg":s.id===6?"https://stroy.cataloged.ru/pics/pp/pics/logo/master_210730_20260508.webp":null),website:s.website,phone:s.phone,address:s.address,mapsUrl:s.maps_url}));
   const nextProducts=(data.products||[]).map(p=>({...p,shop:p.shop_id,price:p.price_rub,icon:productIcons[p.id]||productIconFor(p),imageUrl:p.image_url,category:p.category,description:p.description,sourceUrl:p.source_url}));
   // Do not replace the usable starter catalogue with empty arrays if a new database is not seeded yet.
   if(nextShops.length){setShopData(nextShops);setProductData(nextProducts);setActiveShop(current=>current?nextShops.find(s=>s.id===current.id)||current:current);if(Array.isArray(data.categories))setShopCategories(data.categories.filter(x=>x.category_type==="shop"))}
   else setNotice("Каталог временно недоступен");
  })
  .catch(()=>{if(!cancelled){setProductData([]);setNotice("Каталог временно недоступен — товары не показываем до восстановления связи")}})
  .finally(()=>{if(!cancelled)setCatalogLoading(false)});
 return()=>{cancelled=true};
},[]);
const [orders,setOrders]=useState(()=>{try{return JSON.parse(localStorage.getItem("timtim-orders")||"[]")}catch{return[]}});
useEffect(()=>{localStorage.setItem("timtim-orders",JSON.stringify(orders))},[orders]);
useEffect(()=>{
 const refresh=async()=>{
  const tracked=orders.filter(o=>o.trackingToken&&o.id);
  await Promise.all(tracked.map(async o=>{
   try{
    const response=await fetch(API_URL+"/api/orders/"+encodeURIComponent(o.id),{headers:{"x-order-token":o.trackingToken}});
    if(!response.ok)return;
    const data=await response.json();
    setOrders(current=>current.map(item=>item.id===o.id?{...item,status:data.order.status,deliveryFee:data.order.delivery_fee_rub,total:data.order.total_rub,updatedAt:data.order.updated_at}:item));
   }catch{}
  }));
 };
 refresh();
 const timer=setInterval(refresh,30000);
 return()=>clearInterval(timer);
},[orders.filter(o=>o.trackingToken).map(o=>o.id+":"+o.status).join("|")]);
useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(""),2300);return()=>clearTimeout(id)},[notice]);
useEffect(()=>{
 if(!adminAuthenticated||page!=="operator")return;
 const timer=setInterval(()=>{
  const focused=document.activeElement;
  if(focused&&["INPUT","SELECT","TEXTAREA"].includes(focused.tagName))return;
  loadOperatorOrders(adminSession);
 },30000);
 return()=>clearInterval(timer);
},[adminAuthenticated,page,adminSession]);

const total=cart.reduce((s,p)=>s+p.price*p.qty,0),count=cart.reduce((s,p)=>s+p.qty,0),cartShop=cart.length?shopData.find(s=>s.id===cart[0].shop):null;
const normalizedQuery=query.trim().toLocaleLowerCase("ru-RU");
const visibleShops=shopData.filter(s=>(category==="Все"||s.category===category)&&(!normalizedQuery||s.name.toLocaleLowerCase("ru-RU").includes(normalizedQuery)||productData.some(p=>p.shop===s.id&&p.name.toLocaleLowerCase("ru-RU").includes(normalizedQuery))));
const visibleProducts=useMemo(()=>activeShop?productData.filter(p=>p.shop===activeShop.id&&p.name.toLowerCase().includes(query.toLowerCase())):[],[activeShop,query,productData]);
const shopSections=useMemo(()=>shopSectionOrder.filter(section=>visibleProducts.some(p=>productSection(p)===section)),[visibleProducts]);
const sectionProducts=useMemo(()=>visibleProducts.filter(p=>productSectionFilter==="Все"||productSection(p)===productSectionFilter),[visibleProducts,productSectionFilter]);
function addProduct(p){if(cart.length&&cart[0].shop!==p.shop){setNotice("В корзине товары другого магазина. Сначала очистите корзину.");return}setCart(old=>{const f=old.find(x=>x.id===p.id);return f?old.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...old,{...p,qty:1}]});setNotice("Добавлено в корзину")}
function changeQty(id,d){setCart(old=>old.map(p=>p.id===id?{...p,qty:p.qty+d}:p).filter(p=>p.qty>0))}
async function submitOrder(){
 if(isSubmitting)return;
 if(total<700){setNotice("Минимальная сумма заказа — 700 ₽");return}
 if(!address.trim()||!house.trim()||!phone.trim()){setNotice("Укажите адрес и телефон");return}
 const deliveryAddress=[address.trim(),house.trim()?("дом "+house.trim()):"",apartment.trim()?"кв. "+apartment.trim():"",entrance.trim()?"подъезд "+entrance.trim():"",floor.trim()?"этаж "+floor.trim():""].filter(Boolean).join(", ");
 if(!cartShop){setNotice("Не удалось определить магазин");return}
 setIsSubmitting(true);
 try{
  const response=await fetch(API_URL+"/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shopId:cartShop.id,items:cart.map(p=>({productId:p.id,qty:p.qty})),phone,address:deliveryAddress,comment})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось отправить заказ. Попробуйте позже.");
  const serverOrder=data.order;
  const o={id:serverOrder.id,orderNumber:serverOrder.order_number,trackingToken:data.trackingToken,items:cart.map(p=>({...p})),total:serverOrder.total_rub,shopName:cartShop.name,address:deliveryAddress,phone,comment,status:serverOrder.status,created:new Date(serverOrder.created_at).toLocaleString("ru-RU")};
  setOrders(old=>[o,...old]);setCart([]);setAddress("");setHouse("");setApartment("");setEntrance("");setFloor("");setPhone("");setComment("");setSelectedOrder(o.id);setPage("success");
 }catch(error){setNotice(error.message||"Ошибка соединения с сервером")}
 finally{setIsSubmitting(false)}
}
async function loadAdminCatalog(session=adminSession){
 try{
  const response=await fetch(API_URL+"/api/admin/catalog",{credentials:"include",headers:session?{Authorization:"Bearer "+session}:{}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось загрузить каталог");
  setAdminShops(data.shops||[]);setAdminProducts(data.products||[]);setAdminCategories(data.categories||[]);setShopCategories((data.categories||[]).filter(x=>x.category_type==="shop"));
 }catch(error){setAdminError(error.message||"Ошибка загрузки каталога")}
}
function resetShopForm(){setEditingShopId(null);setShopForm({name:"",category:shopCategories[0]?.name||"Продукты",description:"",imageUrl:null,logoUrl:null,cardBackground:"#ffffff",website:"",phone:"",address:"",mapsUrl:"",isActive:true});}
function editShop(shop){setEditingShopId(shop.id);setShopForm({name:shop.name||"",category:shop.category||"Продукты",description:shop.description||"",imageUrl:shop.image_url||null,logoUrl:shop.logo_url||null,cardBackground:shop.card_background||"#ffffff",website:shop.website||"",phone:shop.phone||"",address:shop.address||"",mapsUrl:shop.maps_url||"",isActive:Boolean(shop.is_active)});window.scrollTo({top:0,behavior:"smooth"});}
async function saveShopForm(){
 if(shopForm.name.trim().length<2){setAdminError("Напишите название магазина.");return}
 setShopSaving(true);
 try{
  const payload={name:shopForm.name.trim(),category:shopForm.category,description:shopForm.description,imageUrl:shopForm.imageUrl||null,logoUrl:shopForm.logoUrl||null,cardBackground:shopForm.cardBackground||"#ffffff",website:shopForm.website,phone:shopForm.phone,address:shopForm.address,mapsUrl:shopForm.mapsUrl,...(editingShopId?{isActive:shopForm.isActive}:{})};
  const response=await fetch(API_URL+(editingShopId?"/api/admin/shops/"+editingShopId:"/api/admin/shops"),{method:editingShopId?"PATCH":"POST",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить магазин");
  resetShopForm();await loadAdminCatalog();setAdminError("");setNotice(editingShopId?"Изменения магазина сохранены":"Магазин создан");
 }catch(error){setAdminError(error.message||"Ошибка сохранения магазина")}
 finally{setShopSaving(false)}
}
function resetProductForm(){setEditingProductId(null);setProductForm({shopId:adminShops[0]?.id||"",name:"",priceRub:"",unit:"шт.",category:adminCategories.find(x=>x.category_type==="product"&&x.is_active)?.name||"Другое",description:"",imageUrl:null,sourceUrl:"",isActive:true});}
function editProduct(product){setEditingProductId(product.id);setProductForm({shopId:String(product.shop_id),name:product.name||"",priceRub:String(product.price_rub??""),unit:product.unit||"шт.",category:product.category||"Другое",description:product.description||"",imageUrl:product.image_url||null,sourceUrl:product.source_url||"",isActive:Boolean(product.is_active)});window.scrollTo({top:0,behavior:"smooth"});}
async function saveProductForm(){
 if(!productForm.shopId||productForm.name.trim().length<2||productForm.priceRub===""||!Number.isInteger(Number(productForm.priceRub))||Number(productForm.priceRub)<0||!productForm.unit.trim()){setAdminError("Заполните магазин, название, цену и единицу товара.");return}
 setProductSaving(true);
 try{
  const payload={shopId:Number(productForm.shopId),name:productForm.name.trim(),priceRub:Number(productForm.priceRub),unit:productForm.unit.trim(),category:productForm.category||"Другое",description:productForm.description, imageUrl:productForm.imageUrl||null,sourceUrl:productForm.sourceUrl,...(editingProductId?{isActive:productForm.isActive}:{})};
  const response=await fetch(API_URL+(editingProductId?"/api/admin/products/"+editingProductId:"/api/admin/products"),{method:editingProductId?"PATCH":"POST",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить товар");
  resetProductForm();await loadAdminCatalog();setAdminError("");setNotice(editingProductId?"Товар обновлён":"Товар опубликован");
 }catch(error){setAdminError(error.message||"Ошибка сохранения товара")}
 finally{setProductSaving(false)}
}
async function saveCategory(category){
 try{
  const payload={name:category.name,emoji:category.emoji||"🛍️",imageUrl:category.image_url||null,sortOrder:Number(category.sort_order)||100,isActive:Boolean(category.is_active)};
  const response=await fetch(API_URL+"/api/admin/categories/"+category.id,{method:"PATCH",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить категорию");
  await loadAdminCatalog();setAdminError("");setNotice("Категория сохранена");
 }catch(error){setAdminError(error.message||"Ошибка сохранения категории")}
}
async function createCategory(){
 if(categoryForm.name.trim().length<2){setAdminError("Введите название категории.");return}
 setCategorySaving(true);
 try{
  const response=await fetch(API_URL+"/api/admin/categories",{method:"POST",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({...categoryForm,name:categoryForm.name.trim(),imageUrl:categoryForm.imageUrl||null,sortOrder:Number(categoryForm.sortOrder)||100})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось создать категорию");
  setCategoryForm({name:"",categoryType:categoryForm.categoryType,emoji:"🛍️",imageUrl:null,sortOrder:100});await loadAdminCatalog();setAdminError("");setNotice("Категория создана");
 }catch(error){setAdminError(error.message||"Ошибка создания категории")}
 finally{setCategorySaving(false)}
}
async function loadOperatorOrders(session=adminSession){
 try{
  const headers=session?{Authorization:"Bearer "+session}:{};
  const [response,individualResponse]=await Promise.all([fetch(API_URL+"/api/admin/orders",{credentials:"include",headers}),fetch(API_URL+"/api/admin/individual-requests",{credentials:"include",headers})]);
  const data=await response.json().catch(()=>({}));
  const individualData=await individualResponse.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось загрузить заказы");
  if(!individualResponse.ok)throw new Error(individualData.error||"Не удалось загрузить индивидуальные заявки");
  setAdminOrders(data.orders||[]);setAdminIndividualRequests(individualData.requests||[]);setAdminAuthenticated(true);setAdminError("");await loadAdminCatalog(session);
 }catch(error){setAdminAuthenticated(false);setAdminError(error.message||"Ошибка загрузки")}
}
async function submitIndividualRequest(){
 if(individualSubmitting)return;
 if(individualStore.trim().length<2||individualStoreAddress.trim().length<5||individualItems.trim().length<3||individualDeliveryAddress.trim().length<5||individualPhone.trim().length<7){setNotice("Заполните магазин, список товаров, адрес доставки и телефон");return}
 setIndividualSubmitting(true);
 try{
  const response=await fetch(API_URL+"/api/individual-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeName:individualStore,storeAddress:individualStoreAddress,itemsText:individualItems,deliveryAddress:individualDeliveryAddress,phone:individualPhone,comment:individualComment})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось отправить заявку");
  setIndividualSuccessNumber(data.request?.request_number||data.request?.id||"");setIndividualStore("");setIndividualStoreAddress("");setIndividualItems("");setIndividualDeliveryAddress("");setIndividualPhone("");setIndividualComment("");setPage("individual-success");
 }catch(error){setNotice(error.message||"Ошибка отправки заявки")}
 finally{setIndividualSubmitting(false)}
}
async function loginOperator(event){
 event.preventDefault();setAdminError("");
 try{
  const response=await fetch(API_URL+"/api/admin/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:adminPassword})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось войти");
  setAdminPassword("");setAdminSession(data.sessionToken||"");await loadOperatorOrders(data.sessionToken||"");
 }catch(error){setAdminError(error.message||"Ошибка входа")}
}
async function changeOperatorStatus(id,status){
 try{
  const response=await fetch(API_URL+"/api/admin/orders/"+encodeURIComponent(id)+"/status",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({status})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось обновить статус");
  setAdminOrders(old=>old.map(o=>o.id===id?{...o,status:data.order.status}:o));
 }catch(error){setAdminError(error.message||"Ошибка обновления статуса")}
}
async function changeIndividualRequestStatus(id,status){
 try{
  const response=await fetch(API_URL+"/api/admin/individual-requests/"+encodeURIComponent(id)+"/status",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({status})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось обновить статус заявки");
  setAdminIndividualRequests(old=>old.map(r=>r.id===id?{...r,status:data.request.status}:r));
  setAdminError("");
 }catch(error){setAdminError(error.message||"Ошибка обновления статуса")}
}
async function saveDeliveryFee(id,deliveryFeeRub){
 try{
  const response=await fetch(API_URL+"/api/admin/orders/"+encodeURIComponent(id)+"/delivery-fee",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({deliveryFeeRub:Number(deliveryFeeRub)})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось сохранить доставку");
  setAdminOrders(old=>old.map(o=>o.id===id?{...o,...data.order}:o));
  setAdminError("");
 }catch(error){setAdminError(error.message||"Ошибка сохранения доставки")}
}
async function logoutOperator(){
 try{await fetch(API_URL+"/api/admin/logout",{method:"POST",credentials:"include",headers:adminSession?{Authorization:"Bearer "+adminSession}:{}})}catch{}
 setAdminSession("");setAdminAuthenticated(false);setAdminOrders([]);setPage("profile");
}
return <div className="app-shell">
<header className="topbar"><button className="brand" onClick={()=>{setPage("home");setActiveShop(null)}}><img className="brand-mark" src={brandLogo||"/timtim-logo.svg"} alt="Тим-Тим — доставка из магазинов" /></button><button className="icon-button cart-top" onClick={()=>setPage("cart")} aria-label="Корзина"><ShoppingBag size={21}/>{count>0&&<i>{count}</i>}</button></header>
<main>
{page==="home"&&<div className="home-page">
<section className="home-location"><div><span className="location-dot"><MapPin size={15}/></span><span><small>Доставляем в</small><b>Тимашевск</b></span></div><span className="delivery-chip"><Clock3 size={14}/> 30–60 мин</span></section>
<section className="hero hero-market"><div className="hero-copy"><span className="eyebrow">ТВОЙ ГОРОД · ТВОИ МАГАЗИНЫ</span><h1>Всё нужное.<br/><em>С доставкой.</em></h1><p>Продукты, цветы и товары для дома — заказывай в одном месте.</p><button className="hero-cta" onClick={()=>document.getElementById("shops")?.scrollIntoView({behavior:"smooth"})}>Смотреть магазины <ArrowRight size={16}/></button></div><div className="hero-art"><div className="hero-art-circle"></div><div className="hero-art-bag">🛍️</div><span className="hero-art-spark spark-one">✳</span><span className="hero-art-spark spark-two">✦</span></div></section>
<div className="search-wrap home-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти магазин или товар"/></div>
<section className="quick-categories"><div className="section-head"><h2>Категории</h2><span className="muted">Выбирай своё</span></div><div className="category-tiles">{[...shopCategories.map((c,i)=>({...c,tone:["green","orange","pink","sand"][i%4]})),{name:"Все",emoji:"✨",tone:"violet"}].map(c=><button key={c.name} className={`category-tile ${c.tone} ${category===c.name?"chosen":""}`} onClick={()=>setCategory(c.name)}><span>{c.image_url?<img src={c.image_url} alt=""/>:c.emoji}</span><b>{c.name}</b></button>)}</div></section>
<section className="delivery-promo"><div className="promo-icon">🚗</div><div><b>Доставим до двери</b><span>Минимальный заказ — 700 ₽ · Работаем с 09:00 до 21:00</span></div><ArrowRight size={17}/></section>
<button className="individual-order-promo" onClick={()=>setPage("individual-order")}><span className="individual-order-icon">✦</span><span><b>Не нашли нужный магазин?</b><small>Закажите из любого магазина Тимашевска — просто напишите список покупок</small><strong>Оформить индивидуальный заказ <ArrowRight size={15}/></strong></span></button>
<div className="section-head shops-heading" id="shops"><div><span className="eyebrow dark">ВЫБИРАЙТЕ МЕСТО</span><h2>Магазины рядом</h2></div><span className="muted">{visibleShops.length} {shopCountLabel(visibleShops.length)}</span></div>
<div className="shop-grid">{visibleShops.map((s,i)=><button style={{backgroundColor:s.card_background||undefined}} className={`shop-card shop-card-v2 shop-tone-${i%3} shop-card-${Number(s.id)} ${Number(s.id)===12?"shop-card-yobidoyobi":""} ${Number(s.id)===11?"shop-card-povorot":""}`} key={s.id} onClick={()=>{const q=query.trim().toLocaleLowerCase("ru-RU");const productMatch=Boolean(q&&productData.some(p=>p.shop===s.id&&p.name.toLocaleLowerCase("ru-RU").includes(q)));setActiveShop(s);setProductSectionFilter("Все");setPage("shop");if(!productMatch)setQuery("")}}><div className="shop-visual"><ShopBrandMark shop={s}/><span className="shop-card-photo-fallback" style={{display:(s.imageUrl||[7,9,10,14,15].includes(Number(s.id)))?"none":"grid"}}>{s.icon||"🏬"}</span><small>{s.time}</small></div><div className="shop-card-copy"><span className="shop-category">{s.category}</span><div className="shop-title-row"><ShopMiniIcon shop={s}/><b>{s.name}</b></div><small>{s.description}</small><span className="shop-foot">Открыть магазин <ArrowRight size={15}/></span></div></button>)}</div>
<p className="demo-note">Каталог загружается из базы сервиса. Актуальные цены и наличие оператор подтвердит перед сборкой заказа.</p>
</div>}{page==="shop"&&activeShop&&<div className={`storefront ${(Number(activeShop.id)===5||activeShop.name==="Хлебный дворик")?"bakery-storefront":Number(activeShop.id)===6||activeShop.name==="Мастер"?"construction-storefront":Number(activeShop.id)===12||activeShop.name==="Ёбидоёби"?"yobidoyobi-storefront":Number(activeShop.id)===11||activeShop.name==="Поворот"?"povorot-storefront":Number(activeShop.id)===1?"grocery-storefront":Number(activeShop.id)===2?"flower-storefront":Number(activeShop.id)===4?"homegoods-storefront":Number(activeShop.id)===9?"pyaterochka-storefront":Number(activeShop.id)===10?"magnit-storefront":Number(activeShop.id)===7?"rostics-storefront":Number(activeShop.id)===8?"perlins-storefront":Number(activeShop.id)===13?"crab-storefront":Number(activeShop.id)===14?"mcosmetic-storefront":Number(activeShop.id)===15?"dodo-storefront":""}`}>

<button className="back-link" onClick={()=>{setPage("home");setQuery("")}}><ArrowLeft size={17}/> Все магазины</button><section className="store-hero">{(Number(activeShop.id)===5||activeShop.name==="Хлебный дворик")&&<div className="bakery-header-art" aria-hidden="true"><CroissantFloat className="header-croissant"/><PizzaFloat/><PastryFloat/><WheatFloat/><BreadFloat/><BaguetteFloat/></div>}{(Number(activeShop.id)===6||activeShop.name==="Мастер")&&<div className="construction-header-art" aria-hidden="true"><span className="construction-orbit orbit-one">⚙</span><span className="construction-tool tool-hammer">🔨</span><span className="construction-tool tool-ruler">📐</span><span className="construction-tool tool-toolbox">🧰</span><span className="construction-blueprint-grid"/></div>}{(Number(activeShop.id)===12||activeShop.name==="Ёбидоёби")&&<div className="yobi-header-art" aria-hidden="true"><span className="yobi-float yobi-sushi-one">🍣</span><span className="yobi-float yobi-sushi-two">🍙</span><span className="yobi-float yobi-sushi-three">🥢</span><span className="yobi-orbit"/></div>}{(Number(activeShop.id)===11||activeShop.name==="Поворот")&&<div className="povorot-header-art" aria-hidden="true"><span className="povorot-art-word">ПОВОРОТ</span><span className="povorot-art-line">СТРОИТЕЛЬНЫЙ ГИПЕРМАРКЕТ</span><span className="povorot-art-shape shape-one"/><span className="povorot-art-shape shape-two"/></div>}<span className={Number(activeShop.id)===6?"store-hero-master-mark":Number(activeShop.id)===11?"store-hero-povorot-mark":""}>{Number(activeShop.id)===6?"М":Number(activeShop.id)===11?"П":([7,9,10,14,15].includes(Number(activeShop.id))||/(rostic|пятёроч|пятероч|^магнит$|м\.косметик|магнит косметик|додо)/i.test(activeShop.name||""))?<ShopBrandMark shop={activeShop}/>:activeShop.imageUrl?<img src={activeShop.imageUrl} alt={activeShop.name}/>:activeShop.icon}</span><div><small>{activeShop.category}</small><h1>{activeShop.name}</h1><p><Clock3 size={14}/> {activeShop.time} · Тимашевск</p><p>{activeShop.description}</p>{activeShop.address&&![7,9,10,14,15].includes(Number(activeShop.id))&&!/(rostic|пятёроч|пятероч|^магнит$|м\.косметик|магнит косметик|додо)/i.test(activeShop.name||"")&&<p><MapPin size={14}/> {activeShop.address}</p>}{activeShop.website&&<a href={activeShop.website} target="_blank" rel="noreferrer">Сайт магазина</a>}{activeShop.phone&&<a href={"tel:"+activeShop.phone.replace(/[^+0-9]/g,"")}>{activeShop.phone}</a>}{activeShop.mapsUrl&&<a href={activeShop.mapsUrl} target="_blank" rel="noreferrer">Открыть на Яндекс Картах</a>}</div></section><div className="section-head compact"><div><h2>Каталог</h2><span className="muted">{sectionProducts.length} из {visibleProducts.length} товаров</span></div></div><div className="search-wrap storefront-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={"Найти товар в магазине «"+activeShop.name+"»"}/></div><div className="store-category-tabs"><button className={productSectionFilter==="Все"?"active":""} onClick={()=>setProductSectionFilter("Все")}>Все <small>{visibleProducts.length}</small></button>{shopSections.map(section=><button key={section} className={productSectionFilter===section?"active":""} onClick={()=>setProductSectionFilter(section)}>{section} <small>{visibleProducts.filter(p=>productSection(p)===section).length}</small></button>)}</div><div className="product-grid">{sectionProducts.map(p=><article className="product-card" key={p.id} role="button" tabIndex="0" onClick={()=>setSelectedProduct(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelectedProduct(p)}}}><div className="product-picture">{p.imageUrl?<img src={p.imageUrl} alt={p.name} loading="lazy" onError={e=>{const parent=e.currentTarget.parentElement;e.currentTarget.remove();const fallback=document.createElement("span");fallback.className="product-picture-fallback";fallback.innerHTML=`<i>${p.icon||"🥐"}</i><small>Фото скоро</small>`;parent.appendChild(fallback)}}/>:<span className="product-picture-fallback"><i>{p.icon||"🥐"}</i><small>Фото скоро</small></span>}</div><div className="product-details"><b>{p.name}</b><small>{p.unit}</small>{p.description&&<small className="product-description">{p.description}</small>}<strong>{money(p.price)}</strong></div><button className="add-button" aria-label={"Добавить "+p.name} onClick={e=>{e.stopPropagation();addProduct(p)}}><Plus size={19}/></button></article>)}</div>{sectionProducts.length===0&&<section className="empty-state master-catalog-empty"><span>{Number(activeShop.id)===6?"🛠️":Number(activeShop.id)===2?"💐":Number(activeShop.id)===4?"🪴":Number(activeShop.id)===1?"🛒":"🛍️"}</span><h2>{normalizedQuery&&visibleProducts.length===0?"Ничего не найдено":"Каталог «"+activeShop.name+"» подключаем"}</h2><p>{normalizedQuery&&visibleProducts.length===0?"Попробуйте изменить запрос или отправьте список оператору.": "Пока можно отправить список покупок — оператор проверит возможность покупки, наличие и актуальные цены, затем согласует итоговую сумму с вами."}</p><button className="primary-button" onClick={()=>{setIndividualStore(activeShop.name);setIndividualStoreAddress(activeShop.address||"г. Тимашевск");setIndividualItems("");setPage("individual-order")}}>Заказать по списку</button></section>}{count>0&&cartShop?.id===activeShop.id&&<button className={`bakery-cart-bar ${Number(activeShop.id)===6?"construction-cart-bar":""}`} onClick={()=>setPage("cart")}><span className="bakery-cart-count">{count}</span><span><b>Перейти в корзину</b><small>{count} товара · {money(total)}</small></span><strong>{money(total)}</strong><ArrowRight size={19}/></button>}</div>}
{page==="individual-order"&&<><button className="back-link" onClick={()=>setPage("home")}><ArrowLeft size={17}/> На главную</button><div className="page-title"><span className="eyebrow dark">ПОКУПКА ПО ВАШЕМУ СПИСКУ</span><h1>Индивидуальный заказ</h1><p className="individual-intro">Укажите магазин и товары, которые нужно купить. Мы проверим возможность покупки, уточним цены и стоимость доставки и свяжемся с вами для согласования.</p></div><div className="form-card individual-form"><label>Название магазина<input value={individualStore} onChange={e=>setIndividualStore(e.target.value)} placeholder="Например, Магнит, Пятёрочка, рынок"/></label><label>Адрес магазина<input value={individualStoreAddress} onChange={e=>setIndividualStoreAddress(e.target.value)} placeholder="Улица, дом или адрес филиала"/></label><label>Что купить?<textarea value={individualItems} onChange={e=>setIndividualItems(e.target.value)} placeholder={"Например:\nМолоко 2 шт.\nХлеб 1 шт.\nЯйца 2 десятка"} rows="5"/></label><label>Адрес доставки<input value={individualDeliveryAddress} onChange={e=>setIndividualDeliveryAddress(e.target.value)} placeholder="Улица, дом, квартира"/></label><label>Номер телефона<input value={individualPhone} onChange={e=>setIndividualPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel"/></label><label>Комментарий<textarea value={individualComment} onChange={e=>setIndividualComment(e.target.value)} placeholder="Пожелания, допустимые замены, ориентиры" rows="3"/></label></div><div className="checkout-summary"><div><span>Стоимость товаров</span><b>Уточним в магазине</b></div><div><span>Доставка</span><b>Рассчитаем отдельно</b></div><p>Заявка не является подтверждённым заказом. Оператор сначала проверит наличие, рассчитает итоговую сумму и согласует её с вами. Минимальная сумма покупки — 700 ₽.</p></div><button className="primary-button full" disabled={individualSubmitting||individualStore.trim().length<2||individualStoreAddress.trim().length<5||individualItems.trim().length<3||individualDeliveryAddress.trim().length<5||individualPhone.trim().length<7} onClick={submitIndividualRequest}>{individualSubmitting?"Отправляем заявку…":"Отправить заявку"}</button></>}
{page==="individual-success"&&<div className="success-state"><span><Check size={35}/></span><h1>Заявка отправлена!</h1><p>Индивидуальная заявка №{individualSuccessNumber||"—"} поступила оператору. Он проверит возможность покупки и свяжется с вами для согласования стоимости товаров и доставки.</p><button className="primary-button" onClick={()=>setPage("home")}>На главную</button></div>}
{page==="cart"&&<><button className="back-link" onClick={()=>setPage("home")}><ArrowLeft size={17}/> Продолжить покупки</button><div className="page-title"><span className="eyebrow dark">ВАШ ЗАКАЗ</span><h1>Корзина</h1></div>{!cart.length?<div className="empty-state"><span>🛍️</span><h2>Пока здесь пусто</h2><p>Добавьте товары из любого магазина Тимашевска.</p><button className="primary-button" onClick={()=>setPage("home")}>Выбрать товары</button></div>:<><div className="cart-store"><Store size={17}/><b>{cartShop?.name}</b><span>{count} шт.</span></div>{cart.map(p=><div className="cart-line" key={p.id}><span className="cart-emoji">{p.icon}</span><div className="cart-info"><b>{p.name}</b><small>{money(p.price)} / {p.unit}</small></div><div className="stepper"><button onClick={()=>changeQty(p.id,-1)}><Minus size={14}/></button><b>{p.qty}</b><button onClick={()=>changeQty(p.id,1)}><Plus size={14}/></button></div><strong>{money(p.price*p.qty)}</strong></div>)}<div className="total-row"><span>Товары</span><b>{money(total)}</b></div><div className="minimum-hint">{total<700?"До минимального заказа осталось "+money(700-total):"Минимальная сумма заказа выполнена"}</div><button className="primary-button full" disabled={total<700} onClick={()=>setPage("checkout")}>Перейти к оформлению <ArrowRight size={17}/></button><button className="text-button" onClick={()=>setCart([])}>Очистить корзину</button></>}</>}
{page==="checkout"&&<><button className="back-link" onClick={()=>setPage("cart")}><ArrowLeft size={17}/> Корзина</button><div className="page-title"><span className="eyebrow dark">ПОСЛЕДНИЙ ШАГ</span><h1>Куда доставить?</h1></div><div className="form-card"><div className="checkout-fields-row address-fields-row"><label>Улица<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Например, улица Ленина" autoComplete="address-line1"/></label><label>Дом<input value={house} onChange={e=>setHouse(e.target.value)} placeholder="Номер дома" autoComplete="address-line2"/></label></div><small className="address-hint">Укажите улицу и номер дома вручную — без ошибочных подсказок карты.</small><div className="checkout-fields-row"><label>Квартира<input value={apartment} onChange={e=>setApartment(e.target.value)} placeholder="№ квартиры" inputMode="numeric"/></label><label>Подъезд<input value={entrance} onChange={e=>setEntrance(e.target.value)} placeholder="№" inputMode="numeric"/></label><label>Этаж<input value={floor} onChange={e=>setFloor(e.target.value)} placeholder="№" inputMode="numeric"/></label></div><label>Номер телефона<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel"/></label><label>Комментарий курьеру<textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Домофон, ориентир или пожелания к доставке" rows="3"/></label></div><div className="checkout-summary"><div><span>Магазин</span><b>{cartShop?.name}</b></div><div><span>Товары</span><b>{money(total)}</b></div><div><span>Доставка</span><b>Рассчитаем и сообщим отдельно</b></div><p>Сначала отправится заявка. Оператор уточнит наличие и стоимость доставки, а заказ подтвердит после согласования итоговой суммы.</p></div><button className="primary-button full" disabled={isSubmitting||!address.trim()||!house.trim()||!phone.trim()||total<700} onClick={submitOrder}>{isSubmitting?"Отправляем заявку…":<>Отправить заявку · {money(total)}</>}</button></>}
{page==="success"&&<div className="success-state"><span><Check size={35}/></span><h1>Заказ принят!</h1><p>Заявка №{orders.find(o=>o.id===selectedOrder)?.orderNumber||"—"} отправлена оператору. Он уточнит наличие товаров и стоимость доставки, после чего подтвердит итоговую сумму.</p><button className="primary-button" onClick={()=>setPage("orders")}>Посмотреть заказы</button></div>}
{page==="orders"&&<><div className="page-title"><span className="eyebrow dark">ИСТОРИЯ ПОКУПОК</span><h1>Мои заказы</h1></div>{!orders.length?<div className="empty-state"><span>📦</span><h2>Заказов пока нет</h2><p>Оформленные заказы появятся здесь.</p></div>:orders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>Заказ №{o.orderNumber||String(o.id).slice(-6)}</b><span className="status-pill">{o.status}</span></div><small>{o.created} · {o.shopName}</small><div className="order-bottom"><b>{money(o.total)}</b><button onClick={()=>setSelectedOrder(selectedOrder===o.id?null:o.id)}>{selectedOrder===o.id?"Скрыть":"Подробнее"}</button></div>{selectedOrder===o.id&&<div className="order-details">{o.items.map(i=><p key={i.id}>{i.name} × {i.qty}</p>)}<p><MapPin size={13}/> {o.address}</p></div>}</article>)}</>}
{page==="profile"&&<><div className="page-title"><span className="eyebrow dark">ТИМ-ТИМ</span><h1>Профиль</h1></div><div className="profile-card"><span><UserRound size={28}/></span><div><b>Покупатель</b><small>Гостевой профиль · без регистрации</small></div></div><div className="profile-info"><p><MapPin size={17}/> Доставка по Тимашевску</p><p><Truck size={17}/> Ориентир по времени: 30–60 минут</p><p><ShoppingBag size={17}/> Минимальный заказ: 700 ₽</p></div><button className="text-button" onClick={()=>{setAdminError("");setPage("operator");if(adminAuthenticated)loadOperatorOrders()}}>Вход для оператора</button><p className="demo-note">История и отслеживание заказа хранятся в этом браузере. Push- и SMS-уведомления пока не подключены.</p></>}
{page==="operator"&&<><div className="page-title"><span className="eyebrow dark">ЗАЩИЩЁННЫЙ ДОСТУП</span><h1>Панель оператора</h1></div>{!adminAuthenticated?<div className="form-card"><form onSubmit={loginOperator}><label>Пароль оператора<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password"/></label><button className="primary-button full" type="submit" disabled={!adminPassword}>Войти</button></form>{adminError&&<p className="operator-warning">{adminError}</p>}</div>:<><div className="operator-topbar"><b>Заказы · {adminOrders.length} · новые: {adminOrders.filter(o=>o.status==="Новый").length}</b><span>Автообновление каждые 30 секунд</span><div><button className="text-button" onClick={loadOperatorOrders}>Обновить</button><button className="text-button" onClick={logoutOperator}>Выйти</button></div></div>{adminError&&<p className="operator-warning">{adminError}</p>}
<div className="operator-tabs"><button className={operatorTab==="orders"?"active":""} onClick={()=>setOperatorTab("orders")}>Заказы</button><button className={operatorTab==="individual"?"active":""} onClick={()=>setOperatorTab("individual")}>Индивидуальные · {adminIndividualRequests.length}</button><button className={operatorTab==="shops"?"active":""} onClick={()=>{setOperatorTab("shops");loadAdminCatalog()}}>Магазины</button><button className={operatorTab==="products"?"active":""} onClick={()=>{setOperatorTab("products");loadAdminCatalog()}}>Товары</button><button className={operatorTab==="categories"?"active":""} onClick={()=>{setOperatorTab("categories");loadAdminCatalog()}}>Категории</button></div>
{operatorTab==="individual"&&<section className="operator-manager"><h2>Индивидуальные заявки</h2>{!adminIndividualRequests.length?<p className="muted">Пока заявок нет</p>:adminIndividualRequests.map(r=><article className="order-card individual-request-card" key={r.id}><div className="order-top"><b>Заявка №{r.request_number}</b><span className="status-pill">{r.status}</span></div><small>{new Date(r.created_at).toLocaleString("ru-RU")}</small><select className="request-status-select" value={r.status} onChange={e=>changeIndividualRequestStatus(r.id,e.target.value)}>{individualStatuses.map(status=><option key={status}>{status}</option>)}</select><p><b>Магазин:</b> {r.store_name}</p><p><b>Адрес магазина:</b> {r.store_address}</p><p><b>Что купить:</b></p><pre>{r.items_text}</pre><p><b>Доставка:</b> {r.delivery_address}</p><p><b>Телефон:</b> <a href={"tel:"+r.customer_phone}>{r.customer_phone}</a></p>{r.customer_comment&&<p><b>Комментарий:</b> {r.customer_comment}</p>}</article>)}</section>}
{operatorTab==="shops"&&<section className="operator-manager admin-builder">
 <div className="admin-section-heading"><div><span className="eyebrow dark">УПРАВЛЕНИЕ ВИТРИНОЙ</span><h2>Магазины</h2><p>Создавайте карточки магазинов и меняйте всё, что увидит покупатель.</p></div><span className="admin-count">{adminShops.length} шт.</span></div>
 <div className="admin-editor-card">
  <div className="admin-editor-title"><span className="admin-step">1</span><div><b>{editingShopId?"Изменить карточку магазина":"Создать магазин"}</b><small>Название, описание, фотография и контакты</small></div></div>
  <PhotoPicker title="Фото карточки магазина" hint="Автообрезка по центру 16:9 — в превью показан итоговый кадр карточки." aspectRatio={16/9} wide value={shopForm.imageUrl} onChange={v=>setShopForm({...shopForm,imageUrl:v})}/>
  <PhotoPicker title="Маленький логотип в квадратике" hint="Автообрезка по центру 1:1 — так логотип будет выглядеть в карточке." aspectRatio={1} value={shopForm.logoUrl} onChange={v=>setShopForm({...shopForm,logoUrl:v})}/>
  <label className="admin-color-field">Фон карточки магазина <span><input type="color" value={shopForm.cardBackground||"#ffffff"} onChange={e=>setShopForm({...shopForm,cardBackground:e.target.value})}/><code>{shopForm.cardBackground||"#ffffff"}</code></span><button type="button" className="admin-secondary-button" onClick={()=>setShopForm({...shopForm,cardBackground:"#ffffff"})}>Сбросить фон</button></label>
  <div className="admin-form-grid">
   <label>Название магазина *<input value={shopForm.name} onChange={e=>setShopForm({...shopForm,name:e.target.value})} placeholder="Например, Магнит"/></label>
   <label>Категория *<select value={shopForm.category} onChange={e=>setShopForm({...shopForm,category:e.target.value})}>{[...new Set([...adminCategories.filter(x=>x.category_type==="shop").map(x=>x.name),...shopCategories.map(x=>x.name),shopForm.category].filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="span-all">Короткое описание<textarea rows="2" value={shopForm.description} onChange={e=>setShopForm({...shopForm,description:e.target.value})} placeholder="Что покупатель найдёт в этом магазине"/></label>
   <label>Адрес магазина<input value={shopForm.address} onChange={e=>setShopForm({...shopForm,address:e.target.value})} placeholder="Улица, дом"/></label>
   <label>Телефон<input value={shopForm.phone} onChange={e=>setShopForm({...shopForm,phone:e.target.value})} placeholder="+7..."/></label>
   <label>Сайт магазина<input value={shopForm.website} onChange={e=>setShopForm({...shopForm,website:e.target.value})} placeholder="https://..."/></label>
   <label>Ссылка на карту<input value={shopForm.mapsUrl} onChange={e=>setShopForm({...shopForm,mapsUrl:e.target.value})} placeholder="Ссылка на Яндекс Карты"/></label>
  </div>
  {editingShopId&&<label className="admin-checkbox"><input type="checkbox" checked={shopForm.isActive} onChange={e=>setShopForm({...shopForm,isActive:e.target.checked})}/> Показывать магазин покупателям</label>}
  <div className="admin-form-actions"><button className="primary-button" disabled={shopSaving||shopForm.name.trim().length<2} onClick={saveShopForm}>{shopSaving?"Сохраняем…":editingShopId?"Сохранить изменения":"Создать магазин"}</button>{editingShopId&&<button className="admin-secondary-button" onClick={resetShopForm}>Отмена</button>}</div>
 </div>
 <div className="admin-list-heading"><b>Все магазины</b><small>Нажмите «Изменить», чтобы обновить карточку</small></div>
 <div className="admin-entity-list">{adminShops.map(shop=><article className="admin-entity-card" key={shop.id}>
  <div className="admin-entity-image">{shop.image_url?<img src={shop.image_url} alt=""/>:<span>{shops.find(x=>x.id===shop.id)?.icon||"🏬"}</span>}</div>
  <div className="admin-entity-info"><b>{shop.name}</b><small>{shop.category} · {shop.is_active?"В магазине":"Скрыт от покупателей"}</small><small>{adminProducts.filter(x=>x.shop_id===shop.id&&x.is_active).length} активных товаров</small></div>
  <button className="admin-secondary-button" onClick={()=>editShop(shop)}>Изменить</button>
 </article>)}</div>
</section>}
{operatorTab==="products"&&<section className="operator-manager admin-builder">
 <div className="admin-section-heading"><div><span className="eyebrow dark">ТОВАРЫ И ЦЕНЫ</span><h2>Каталог товаров</h2><p>Добавьте фотографию, название и цену — Тим-Тим покажет товар в выбранном магазине.</p></div><span className="admin-count">{adminProducts.length} шт.</span></div>
 <div className="admin-howto"><b>Как добавить товар?</b><ol><li>Выберите магазин.</li><li>Напишите понятное название и цену.</li><li>Загрузите настоящее фото товара.</li><li>Нажмите «Опубликовать товар».</li></ol></div>
 <div className="admin-editor-card">
  <div className="admin-editor-title"><span className="admin-step">1</span><div><b>{editingProductId?"Редактировать товар":"Новый товар"}</b><small>Обязательные поля отмечены звёздочкой *</small></div></div>
  <PhotoPicker title="Фото товара" hint="Автообрезка по центру 1:1 — превью показывает точный кадр для каталога." aspectRatio={1} wide value={productForm.imageUrl} onChange={v=>setProductForm({...productForm,imageUrl:v})}/>
  <div className="admin-form-grid">
   <label>В какой магазин добавить? *<select value={productForm.shopId} onChange={e=>setProductForm({...productForm,shopId:e.target.value})}><option value="">Выберите магазин</option>{adminShops.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Название товара *<input value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="Например, Молоко 3,2%"/></label>
   <label>Цена, ₽ *<input type="number" min="0" step="1" value={productForm.priceRub} onChange={e=>setProductForm({...productForm,priceRub:e.target.value})} placeholder="150"/></label>
   <label>Количество / вес<input value={productForm.unit} onChange={e=>setProductForm({...productForm,unit:e.target.value})} placeholder="1 л, 500 г, шт."/></label>
   <label>Категория<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{[...new Set([...adminCategories.filter(x=>x.category_type==="product"&&x.is_active).map(x=>x.name),...adminProducts.map(x=>x.category),productForm.category].filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="span-all">Описание<textarea rows="2" value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} placeholder="Состав, размер, важные особенности — необязательно"/></label>
   <label className="span-all">Ссылка на товар в магазине (необязательно)<input value={productForm.sourceUrl} onChange={e=>setProductForm({...productForm,sourceUrl:e.target.value})} placeholder="https://..."/></label>
  </div>
  {editingProductId&&<label className="admin-checkbox"><input type="checkbox" checked={productForm.isActive} onChange={e=>setProductForm({...productForm,isActive:e.target.checked})}/> Показывать товар покупателям</label>}
  <div className="admin-form-actions"><button className="primary-button" disabled={productSaving||!productForm.shopId||productForm.name.trim().length<2||productForm.priceRub===""||!Number.isInteger(Number(productForm.priceRub))} onClick={saveProductForm}>{productSaving?"Сохраняем…":editingProductId?"Сохранить товар":"Опубликовать товар"}</button>{editingProductId&&<button className="admin-secondary-button" onClick={resetProductForm}>Отмена</button>}</div>
 </div>
 <div className="admin-list-heading"><b>Все товары</b><small>Можно изменить фото, цену, описание или скрыть позицию</small></div>
 <div className="admin-entity-list">{adminProducts.map(product=><article className="admin-entity-card" key={product.id}>
  <div className="admin-entity-image">{product.image_url?<img src={product.image_url} alt=""/>:<span>{productIcons[product.id]||"🛍️"}</span>}</div>
  <div className="admin-entity-info"><b>{product.name}</b><small>{adminShops.find(s=>s.id===product.shop_id)?.name||"Магазин"} · {product.category||"Без категории"}</small><strong>{money(product.price_rub)} / {product.unit}</strong><small>{product.is_active?"Опубликован":"Скрыт от покупателей"}</small></div>
  <button className="admin-secondary-button" onClick={()=>editProduct(product)}>Изменить</button>
 </article>)}</div>
</section>}
{operatorTab==="categories"&&<section className="operator-manager admin-builder">
 <div className="admin-section-heading"><div><span className="eyebrow dark">СТРУКТУРА КАТАЛОГА</span><h2>Категории</h2><p>Категории помогают покупателю быстрее находить магазины и товары. Для плитки на главной можно загрузить своё фото.</p></div></div>
 <div className="admin-editor-card">
  <div className="admin-editor-title"><span className="admin-step">+</span><div><b>Добавить категорию</b><small>Создайте новую категорию магазинов или товаров</small></div></div>
  <div className="admin-form-grid">
   <label>Где будет использоваться?<select value={categoryForm.categoryType} onChange={e=>setCategoryForm({...categoryForm,categoryType:e.target.value})}><option value="shop">Категория магазинов</option><option value="product">Категория товаров</option></select></label>
   <label>Название категории *<input value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value})} placeholder="Например, Зоотовары"/></label>
   <label>Эмодзи, если нет фотографии<input value={categoryForm.emoji} onChange={e=>setCategoryForm({...categoryForm,emoji:e.target.value})} placeholder="🛍️"/></label>
   <label>Порядок на витрине<input type="number" min="0" value={categoryForm.sortOrder} onChange={e=>setCategoryForm({...categoryForm,sortOrder:e.target.value})}/></label>
  </div>
  <PhotoPicker title="Фото категории (необязательно)" hint="Автообрезка по центру 1:1 — превью показывает вид плитки на главной." aspectRatio={1} wide value={categoryForm.imageUrl} onChange={v=>setCategoryForm({...categoryForm,imageUrl:v})}/>
  <button className="primary-button" disabled={categorySaving||categoryForm.name.trim().length<2} onClick={createCategory}>{categorySaving?"Создаём…":"Добавить категорию"}</button>
 </div>
 {["shop","product"].map(kind=><div className="admin-category-group" key={kind}>
  <div className="admin-list-heading"><b>{kind==="shop"?"Категории магазинов":"Категории товаров"}</b><small>{adminCategories.filter(x=>x.category_type===kind).length} категорий</small></div>
  {adminCategories.filter(x=>x.category_type===kind).map(item=><article className="admin-category-card" key={item.id}>
   <PhotoPicker title="Фото категории" hint="Автообрезка по центру 1:1 — превью показывает итоговый вид." aspectRatio={1} value={item.image_url||null} onChange={v=>setAdminCategories(old=>old.map(x=>x.id===item.id?{...x,image_url:v}:x))}/>
   <div className="admin-form-grid"><label>Название<input value={item.name} onChange={e=>setAdminCategories(old=>old.map(x=>x.id===item.id?{...x,name:e.target.value}:x))}/></label><label>Эмодзи<input value={item.emoji||""} onChange={e=>setAdminCategories(old=>old.map(x=>x.id===item.id?{...x,emoji:e.target.value}:x))}/></label><label>Порядок<input type="number" value={item.sort_order} onChange={e=>setAdminCategories(old=>old.map(x=>x.id===item.id?{...x,sort_order:Number(e.target.value)}:x))}/></label></div>
   <label className="admin-checkbox"><input type="checkbox" checked={item.is_active} onChange={e=>setAdminCategories(old=>old.map(x=>x.id===item.id?{...x,is_active:e.target.checked}:x))}/> Показывать категорию</label>
   <button className="primary-button" onClick={()=>saveCategory(item)}>Сохранить категорию</button>
  </article>)}
 </div>)}
</section>}
{operatorTab==="orders"&&<>{!adminOrders.length?<div className="empty-state"><span>📋</span><h2>Заказов пока нет</h2></div>:adminOrders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>№{o.order_number} · {o.shop_name}</b><span className="status-pill">{o.status}</span></div><small>{new Date(o.created_at).toLocaleString("ru-RU")}</small><p>{o.customer_phone} · {o.delivery_address}</p>{o.items.map((item,i)=><p key={i}>{item.name} × {item.qty} · {money(item.lineTotal)}</p>)}{o.customer_comment&&<p>Комментарий: {o.customer_comment}</p>}<div className="fee-editor"><label>Доставка, ₽<input type="number" min="0" max="10000" value={o.delivery_fee_rub??0} onChange={e=>setAdminOrders(old=>old.map(item=>item.id===o.id?{...item,delivery_fee_rub:Number(e.target.value)}:item))}/></label><button className="text-button" onClick={()=>saveDeliveryFee(o.id,o.delivery_fee_rub??0)}>Сохранить доставку</button></div><b>Итого: {money(o.items_total_rub+(o.delivery_fee_rub??0))}</b><select value={o.status} onChange={e=>changeOperatorStatus(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}</>}</>}</>}
</main>
{selectedProduct&&<div className="product-modal-backdrop" role="presentation" onClick={()=>setSelectedProduct(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={selectedProduct?.name||"Товар"} onClick={e=>e.stopPropagation()}><button className="product-modal-close" aria-label="Закрыть" onClick={()=>setSelectedProduct(null)}><X size={20}/></button><div className="product-modal-picture">{selectedProduct?.imageUrl?<img src={selectedProduct.imageUrl} alt={selectedProduct.name}/>:<span>{selectedProduct?.icon||"🥐"}</span>}</div><div className="product-modal-copy"><span className="product-modal-kicker">{shopData.find(s=>s.id===selectedProduct?.shop)?.name||activeShop?.name||"ТИМ-ТИМ"}</span><h2>{selectedProduct?.name}</h2><small>{selectedProduct?.unit}</small>{selectedProduct?.description&&<p>{selectedProduct.description}</p>}<div className="product-modal-bottom"><strong>{selectedProduct?money(selectedProduct.price):""}</strong><button className="primary-button" onClick={()=>{if(selectedProduct)addProduct(selectedProduct);setSelectedProduct(null)}}><Plus size={17}/> Добавить</button></div></div></section></div>}
<nav className="bottom-nav"><button className={["home","shop"].includes(page)?"selected":""} onClick={()=>{setPage("home");setActiveShop(null)}}><Store/><small>Главная</small></button><button className={page==="orders"?"selected":""} onClick={()=>setPage("orders")}><Clock3/><small>Заказы</small></button><button className={page==="cart"||page==="checkout"?"selected":""} onClick={()=>setPage("cart")}><ShoppingBag/><small>Корзина{count?" · "+count:""}</small></button><button className={page==="profile"?"selected":""} onClick={()=>setPage("profile")}><UserRound/><small>Профиль</small></button></nav>
{notice&&<div className="toast">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
</div>}
createRoot(document.getElementById("root")).render(<App/>);
