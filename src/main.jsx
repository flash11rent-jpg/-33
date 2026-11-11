import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Store, Truck, UserRound, X } from "lucide-react";
import "./style.css";
const shops=[
{id:1,name:"Продукты у дома",category:"Продукты",icon:"🛒",time:"30–45 мин",description:"Всё необходимое на каждый день"},
{id:2,name:"Цветочный мир",category:"Цветы",icon:"💐",time:"40–60 мин",description:"Букеты и цветы для близких"},
{id:4,name:"Дом и уют",category:"Для дома",icon:"🏡",time:"40–60 мин",description:"Полезные мелочи для дома"},
{id:6,name:"Мастер",category:"Стройматериалы",icon:"🛠️",time:"40–60 мин",description:"Строительные материалы, инструменты и товары для ремонта"}];
const products=[
{id:1,name:"Молоко 3,2%",price:95,shop:1,unit:"1 л",icon:"🥛"},{id:2,name:"Хлеб белый",price:45,shop:1,unit:"шт.",icon:"🍞"},{id:3,name:"Яйца С1",price:110,shop:1,unit:"10 шт.",icon:"🥚"},{id:4,name:"Бананы",price:130,shop:1,unit:"1 кг",icon:"🍌"},{id:5,name:"Сыр",price:220,shop:1,unit:"300 г",icon:"🧀"},
{id:6,name:"Букет цветов",price:1800,shop:2,unit:"букет",icon:"💐"},{id:7,name:"Ромашки",price:900,shop:2,unit:"букет",icon:"🌼"},{id:8,name:"Тюльпаны",price:1200,shop:2,unit:"букет",icon:"🌷"},
{id:10,name:"Средство для посуды",price:160,shop:4,unit:"шт.",icon:"🧽"},{id:11,name:"Бумажные полотенца",price:190,shop:4,unit:"упаковка",icon:"🧻"}];
const categories=["Все","Продукты","Цветы","Для дома"];
const statuses=["Новый","Подтверждён","Собирается","Готов","В пути","Доставлен","Отменён"];
const money=n=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";
function productSection(p){
 const n=(p.name||"").toLowerCase(), c=(p.category||"").toLowerCase();
 if(n.includes("пицц"))return "Пицца";
 if(n.includes("пирог")||n.includes("штрудель"))return "Пироги";
 if(c.includes("торт")||n.startsWith("торт"))return "Торты";
 if(c.includes("десерт")||n.includes("пирожн")||n.includes("эклер")||n.includes("чизкейк")||n.includes("моти")||n.includes("зефир")||n.includes("трайфл")||n.includes("тарт")||n.includes("круассан")||n.includes("павлов")||n.includes("трубоч")||n.includes("корзинк")||n.includes("кольцо с белковым")||n.includes("чиа"))return "Сладкое";
 if(c.includes("хлеб")||n.includes("хлеб"))return "Хлеб";
 if(c.includes("завтрак")||n.includes("панини"))return "Завтраки";
 if(c.includes("кулинар")||n.includes("котлет")||n.includes("голубц"))return "Кулинария";
 if(c.includes("заморож"))return "Заморозка";
 if(c.includes("выпеч"))return "Выпечка";
 return p.category||"Другое";
}
function CroissantFloat({className}){const gradientId="gold-"+className;return <span className={"bakery-croissant "+className}><svg viewBox="0 0 180 110" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe4a8"/><stop offset=".48" stopColor="#d98b3d"/><stop offset="1" stopColor="#9c5128"/></linearGradient></defs><path d="M14 76C5 65 12 42 29 26 44 12 60 14 67 27c8 13 19 19 33 18 16-1 28-14 37-25 9-11 24-7 29 6 7 19-6 42-24 56-24 19-50 12-72 2-22-10-41 3-56-8Z" fill={"url(#"+gradientId+")"} stroke="#9b572d" strokeWidth="3"/><path d="M32 34c-7 12-10 24-8 36m27-48c-8 17-10 34-5 51m26-42c-7 17-7 34 0 48m25-30c-5 14-3 28 5 40m23-48c-4 15 0 27 10 37m14-52c-1 12 4 21 13 27" fill="none" stroke="#ffe7b5" strokeWidth="5" strokeLinecap="round" opacity=".72"/><path d="M18 68c8 5 17 4 27-1m93 16c11-7 18-17 20-28" fill="none" stroke="#87451f" strokeWidth="3" strokeLinecap="round" opacity=".5"/></svg></span>}
function PizzaFloat(){return <span className="bakery-food pizza-float"><svg viewBox="0 0 120 110" aria-hidden="true"><path d="M12 18Q61 -1 108 20L62 101Z" fill="#e8ad43" stroke="#a95d2b" strokeWidth="4" strokeLinejoin="round"/><path d="M17 22Q62 5 101 23L62 88Z" fill="#f7d77b"/><path d="M21 27Q62 11 95 27" fill="none" stroke="#b84c32" strokeWidth="8" strokeLinecap="round"/><g fill="#b94b35" stroke="#8f382a" strokeWidth="1.5"><circle cx="48" cy="34" r="7"/><circle cx="77" cy="39" r="7"/><circle cx="59" cy="60" r="7"/></g><g fill="#557447"><path d="M35 45q8-10 12 0q-7 8-12 0"/><path d="M79 58q8-10 12 0q-7 8-12 0"/></g><path d="M12 18Q61 -1 108 20" fill="none" stroke="#f8e5a9" strokeWidth="5" strokeLinecap="round"/></svg></span>}
function WheatFloat(){return <span className="bakery-food wheat-float"><svg viewBox="0 0 100 150" aria-hidden="true"><path d="M18 139Q48 87 78 14" fill="none" stroke="#75834a" strokeWidth="5" strokeLinecap="round"/><g fill="#d7ad55" stroke="#a77a35" strokeWidth="1.5"><path d="M68 34Q45 31 47 13Q65 13 68 34Z"/><path d="M59 51Q35 51 36 31Q55 30 59 51Z"/><path d="M51 69Q28 69 29 49Q47 48 51 69Z"/><path d="M43 87Q20 86 21 67Q39 66 43 87Z"/><path d="M75 21Q91 8 91 28Q83 40 75 21Z"/><path d="M67 40Q86 27 85 47Q76 58 67 40Z"/><path d="M59 59Q79 47 77 66Q67 77 59 59Z"/><path d="M51 78Q71 66 69 85Q59 96 51 78Z"/></g></svg></span>}
function BreadFloat(){return <span className="bakery-food bread-float"><svg viewBox="0 0 130 100" aria-hidden="true"><path d="M13 66Q9 34 34 22Q64 3 96 22Q122 37 116 67Q111 88 66 89Q19 89 13 66Z" fill="#c77b39" stroke="#8e4e29" strokeWidth="4"/><path d="M25 57Q28 35 46 28M53 55Q57 29 77 24M82 58Q89 36 104 34" fill="none" stroke="#f5d39a" strokeWidth="9" strokeLinecap="round"/><path d="M17 70Q61 92 112 70" fill="none" stroke="#a85e2f" strokeWidth="4" opacity=".55"/></svg></span>}
function BaguetteFloat(){return <span className="bakery-food baguette-float"><svg viewBox="0 0 150 65" aria-hidden="true"><path d="M10 43Q16 17 45 14L123 8Q144 8 141 28Q137 48 111 51L30 58Q8 59 10 43Z" fill="#d99a4d" stroke="#a96330" strokeWidth="3"/><path d="M39 19L29 42M68 15L58 40M98 12L88 37" stroke="#f8d99e" strokeWidth="7" strokeLinecap="round"/><path d="M15 45Q25 53 43 49" fill="none" stroke="#f4c77f" strokeWidth="3"/></svg></span>}
function PastryFloat(){return <span className="bakery-food pastry-float"><svg viewBox="0 0 120 110" aria-hidden="true"><path d="M20 83Q10 67 26 50L47 22Q60 7 74 22L96 50Q111 69 96 83Z" fill="#d98d43" stroke="#99552d" strokeWidth="4"/><path d="M28 77Q23 65 36 51L54 29Q61 21 68 29L88 53Q99 67 89 78Z" fill="#f3c77e"/><path d="M43 55Q60 37 77 57M38 68Q60 51 82 69" fill="none" stroke="#fff0c9" strokeWidth="6" strokeLinecap="round"/><path d="M26 86Q59 99 94 86" fill="none" stroke="#a65c30" strokeWidth="5" strokeLinecap="round"/><g fill="#fff6df"><circle cx="48" cy="17" r="2"/><circle cx="68" cy="13" r="2"/><circle cx="83" cy="27" r="2"/></g></svg></span>}
const shopSectionOrder=["Сладкое","Выпечка","Пицца","Пироги","Торты","Хлеб","Завтраки","Кулинария","Заморозка","Другое"];
const API_URL="https://tim-tim-api.onrender.com";
function App(){
const [page,setPage]=useState("home"),[category,setCategory]=useState("Все"),[query,setQuery]=useState(""),[activeShop,setActiveShop]=useState(null),[selectedProduct,setSelectedProduct]=useState(null),[cart,setCart]=useState([]),[address,setAddress]=useState(""),[apartment,setApartment]=useState(""),[entrance,setEntrance]=useState(""),[floor,setFloor]=useState(""),[phone,setPhone]=useState(""),[comment,setComment]=useState(""),[notice,setNotice]=useState(""),[selectedOrder,setSelectedOrder]=useState(null),[isSubmitting,setIsSubmitting]=useState(false),[adminPassword,setAdminPassword]=useState(""),[adminSession,setAdminSession]=useState(""),[adminAuthenticated,setAdminAuthenticated]=useState(false),[adminOrders,setAdminOrders]=useState([]),[adminError,setAdminError]=useState("");
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
const [shopData,setShopData]=useState(shops),[productData,setProductData]=useState(products),[catalogLoading,setCatalogLoading]=useState(true),[productSectionFilter,setProductSectionFilter]=useState("Все");
const [operatorTab,setOperatorTab]=useState("orders"),[adminShops,setAdminShops]=useState([]),[adminProducts,setAdminProducts]=useState([]);
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
   const nextShops=(data.shops||[]).map(s=>({...s,icon:shops.find(x=>x.id===s.id)?.icon||(s.id===6?"🛠️":"🥐"),time:shops.find(x=>x.id===s.id)?.time||"30–60 мин",description:s.description||shops.find(x=>x.id===s.id)?.description||"Товары с доставкой по Тимашевску",imageUrl:s.id===6?"https://stroy.cataloged.ru/pics/pp/pics/logo/master_210730_20260508.webp":s.image_url,website:s.website,phone:s.phone,address:s.address}));
   const nextProducts=(data.products||[]).map(p=>({...p,shop:p.shop_id,price:p.price_rub,icon:products.find(x=>x.id===p.id)?.icon||"🛒",imageUrl:p.image_url,category:p.category,description:p.description,sourceUrl:p.source_url}));
   // Do not replace the usable starter catalogue with empty arrays if a new database is not seeded yet.
   if(nextShops.length&&nextProducts.length){setShopData(nextShops);setProductData(nextProducts);setActiveShop(current=>current?nextShops.find(s=>s.id===current.id)||current:current)}
   else setNotice("Пока показываем стартовый каталог");
  })
  .catch(()=>{if(!cancelled)setNotice("Показываем сохранённый каталог")})
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

const total=cart.reduce((s,p)=>s+p.price*p.qty,0),count=cart.reduce((s,p)=>s+p.qty,0),cartShop=cart.length?shopData.find(s=>s.id===cart[0].shop):null;
const visibleShops=shopData.filter(s=>(category==="Все"||s.category===category)&&s.name.toLowerCase().includes(query.toLowerCase()));
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
  setAdminShops(data.shops||[]);setAdminProducts(data.products||[]);
 }catch(error){setAdminError(error.message||"Ошибка загрузки каталога")}
}
async function createAdminShop(){
 try{
  const response=await fetch(API_URL+"/api/admin/shops",{method:"POST",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({name:newShopName,category:newShopCategory})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось добавить магазин");
  setNewShopName("");await loadAdminCatalog();setAdminError("");
 }catch(error){setAdminError(error.message)}
}
async function saveAdminShop(shop){
 try{
  const response=await fetch(API_URL+"/api/admin/shops/"+shop.id,{method:"PATCH",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({name:shop.name,category:shop.category,isActive:shop.is_active})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить магазин");
  await loadAdminCatalog();setAdminError("");
 }catch(error){setAdminError(error.message)}
}
async function createAdminProduct(){
 try{
  const response=await fetch(API_URL+"/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({shopId:Number(newProductShop),name:newProductName,priceRub:Number(newProductPrice),unit:newProductUnit})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось добавить товар");
  setNewProductName("");setNewProductPrice("");await loadAdminCatalog();setAdminError("");
 }catch(error){setAdminError(error.message)}
}
async function saveAdminProduct(product){
 try{
  const response=await fetch(API_URL+"/api/admin/products/"+product.id,{method:"PATCH",headers:{"Content-Type":"application/json",...(adminSession?{Authorization:"Bearer "+adminSession}:{})},body:JSON.stringify({shopId:Number(product.shop_id),name:product.name,priceRub:Number(product.price_rub),unit:product.unit,isActive:product.is_active})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Не удалось сохранить товар");
  await loadAdminCatalog();setAdminError("");
 }catch(error){setAdminError(error.message)}
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
<header className="topbar"><button className="brand" onClick={()=>{setPage("home");setActiveShop(null)}}><img className="brand-mark" src={brandLogo||"/timtim-logo.svg"} alt="Тим-Тим" /><span className="brand-tagline"><small>Доставка из магазинов</small></span></button><button className="icon-button cart-top" onClick={()=>setPage("cart")} aria-label="Корзина"><ShoppingBag size={21}/>{count>0&&<i>{count}</i>}</button></header>
<main>
{page==="home"&&<div className="home-page">
<section className="home-location"><div><span className="location-dot"><MapPin size={15}/></span><span><small>Доставляем в</small><b>Тимашевск</b></span></div><span className="delivery-chip"><Clock3 size={14}/> 30–60 мин</span></section>
<section className="hero hero-market"><div className="hero-copy"><span className="eyebrow">ТВОЙ ГОРОД · ТВОИ МАГАЗИНЫ</span><h1>Всё нужное.<br/><em>С доставкой.</em></h1><p>Продукты, цветы и товары для дома — заказывай в одном месте.</p><button className="hero-cta" onClick={()=>document.getElementById("shops")?.scrollIntoView({behavior:"smooth"})}>Смотреть магазины <ArrowRight size={16}/></button></div><div className="hero-art"><div className="hero-art-circle"></div><div className="hero-art-bag">🛍️</div><span className="hero-art-spark spark-one">✳</span><span className="hero-art-spark spark-two">✦</span></div></section>
<div className="search-wrap home-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти магазин или товар"/></div>
<section className="quick-categories"><div className="section-head"><h2>Категории</h2><span className="muted">Выбирай своё</span></div><div className="category-tiles">{[{name:"Продукты",emoji:"🥑",tone:"green"},{name:"Выпечка",emoji:"🥐",tone:"orange"},{name:"Цветы",emoji:"💐",tone:"pink"},{name:"Для дома",emoji:"🪴",tone:"sand"},{name:"Стройматериалы",emoji:"🛠️",tone:"sand"},{name:"Все",emoji:"✨",tone:"violet"}].map(c=><button key={c.name} className={`category-tile ${c.tone} ${category===c.name?"chosen":""}`} onClick={()=>setCategory(c.name)}><span>{c.emoji}</span><b>{c.name}</b></button>)}</div></section>
<section className="delivery-promo"><div className="promo-icon">🚗</div><div><b>Доставим до двери</b><span>Минимальный заказ — 700 ₽ · Работаем с 09:00 до 21:00</span></div><ArrowRight size={17}/></section>
<button className="individual-order-promo" onClick={()=>setPage("individual-order")}><span className="individual-order-icon">✦</span><span><b>Не нашли нужный магазин?</b><small>Закажите из любого магазина Тимашевска — просто напишите список покупок</small><strong>Оформить индивидуальный заказ <ArrowRight size={15}/></strong></span></button>
<div className="section-head shops-heading" id="shops"><div><span className="eyebrow dark">ВЫБИРАЙТЕ МЕСТО</span><h2>Магазины рядом</h2></div><span className="muted">{visibleShops.length} места</span></div>
<div className="shop-grid">{visibleShops.map((s,i)=><button className={`shop-card shop-card-v2 shop-tone-${i%3}`} key={s.id} onClick={()=>{setActiveShop(s);setProductSectionFilter("Все");setPage("shop");setQuery("")}}><div className="shop-visual">{s.imageUrl?<img src={s.imageUrl} alt="" loading="lazy"/>:<span>{s.icon}</span>}<small>{s.time}</small></div><div className="shop-card-copy"><span className="shop-category">{s.category}</span><b>{s.name}</b><small>{s.description}</small><span className="shop-foot">Открыть магазин <ArrowRight size={15}/></span></div></button>)}</div>
<p className="demo-note">Каталог загружается из базы сервиса. Актуальные цены и наличие оператор подтвердит перед сборкой заказа.</p>
</div>}{page==="shop"&&activeShop&&<div className={`storefront ${(Number(activeShop.id)===5||activeShop.name==="Хлебный дворик")?"bakery-storefront":""}`}>

<button className="back-link" onClick={()=>{setPage("home");setQuery("")}}><ArrowLeft size={17}/> Все магазины</button><section className="store-hero"><div className="bakery-header-art" aria-hidden="true"><CroissantFloat className="header-croissant"/><PizzaFloat/><PastryFloat/><WheatFloat/><BreadFloat/><BaguetteFloat/></div><span>{activeShop.imageUrl?<img src={activeShop.imageUrl} alt={activeShop.name}/>:activeShop.icon}</span><div><small>{activeShop.category}</small><h1>{activeShop.name}</h1><p><Clock3 size={14}/> {activeShop.time} · Тимашевск</p><p>{activeShop.description}</p>{activeShop.address&&<p><MapPin size={14}/> {activeShop.address}</p>}{activeShop.website&&<a href={activeShop.website} target="_blank" rel="noreferrer">Сайт магазина</a>}</div></section><div className="section-head compact"><div><h2>Каталог</h2><span className="muted">{sectionProducts.length} из {visibleProducts.length} товаров</span></div></div><div className="store-category-tabs"><button className={productSectionFilter==="Все"?"active":""} onClick={()=>setProductSectionFilter("Все")}>Все <small>{visibleProducts.length}</small></button>{shopSections.map(section=><button key={section} className={productSectionFilter===section?"active":""} onClick={()=>setProductSectionFilter(section)}>{section} <small>{visibleProducts.filter(p=>productSection(p)===section).length}</small></button>)}</div><div className="product-grid">{sectionProducts.map(p=><article className="product-card" key={p.id} role="button" tabIndex="0" onClick={()=>setSelectedProduct(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelectedProduct(p)}}}><div className="product-picture">{p.imageUrl?<img src={p.imageUrl} alt={p.name} loading="lazy" onError={e=>{const parent=e.currentTarget.parentElement;e.currentTarget.remove();const fallback=document.createElement("span");fallback.textContent=p.icon||"🥐";parent.appendChild(fallback)}}/>:<span>{p.icon}</span>}</div><div className="product-details"><b>{p.name}</b><small>{p.unit}</small>{p.description&&<small className="product-description">{p.description}</small>}<strong>{money(p.price)}</strong></div><button className="add-button" aria-label={"Добавить "+p.name} onClick={e=>{e.stopPropagation();addProduct(p)}}><Plus size={19}/></button></article>)}</div>{Number(activeShop.id)===6&&sectionProducts.length===0&&<section className="empty-state master-catalog-empty"><span>🛠️</span><h2>Каталог «Мастера» готовим</h2><p>Пока можно отправить список нужных материалов и инструментов. Оператор уточнит наличие и цены в магазине на ул. Ленина, 32.</p><button className="primary-button" onClick={()=>{setIndividualStore("Мастер");setIndividualStoreAddress("г. Тимашевск, ул. Ленина, 32");setIndividualItems("");setPage("individual-order")}}>Заказать по списку</button></section>}{count>0&&cartShop?.id===activeShop.id&&<button className="bakery-cart-bar" onClick={()=>setPage("cart")}><span className="bakery-cart-count">{count}</span><span><b>Перейти в корзину</b><small>{count} товара · {money(total)}</small></span><strong>{money(total)}</strong><ArrowRight size={19}/></button>}</div>}
{page==="individual-order"&&<><button className="back-link" onClick={()=>setPage("home")}><ArrowLeft size={17}/> На главную</button><div className="page-title"><span className="eyebrow dark">ПОКУПКА ПО ВАШЕМУ СПИСКУ</span><h1>Индивидуальный заказ</h1><p className="individual-intro">Укажите магазин и товары, которые нужно купить. Мы проверим возможность покупки, уточним цены и стоимость доставки и свяжемся с вами для согласования.</p></div><div className="form-card individual-form"><label>Название магазина<input value={individualStore} onChange={e=>setIndividualStore(e.target.value)} placeholder="Например, Магнит, Пятёрочка, рынок"/></label><label>Адрес магазина<input value={individualStoreAddress} onChange={e=>setIndividualStoreAddress(e.target.value)} placeholder="Улица, дом или адрес филиала"/></label><label>Что купить?<textarea value={individualItems} onChange={e=>setIndividualItems(e.target.value)} placeholder={"Например:\nМолоко 2 шт.\nХлеб 1 шт.\nЯйца 2 десятка"} rows="5"/></label><label>Адрес доставки<input value={individualDeliveryAddress} onChange={e=>setIndividualDeliveryAddress(e.target.value)} placeholder="Улица, дом, квартира"/></label><label>Номер телефона<input value={individualPhone} onChange={e=>setIndividualPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel"/></label><label>Комментарий<textarea value={individualComment} onChange={e=>setIndividualComment(e.target.value)} placeholder="Пожелания, допустимые замены, ориентиры" rows="3"/></label></div><div className="checkout-summary"><div><span>Стоимость товаров</span><b>Уточним в магазине</b></div><div><span>Доставка</span><b>Рассчитаем отдельно</b></div><p>Заявка не является подтверждённым заказом. Оператор сначала проверит наличие, рассчитает итоговую сумму и согласует её с вами. Минимальная сумма покупки — 700 ₽.</p></div><button className="primary-button full" disabled={individualSubmitting||individualStore.trim().length<2||individualStoreAddress.trim().length<5||individualItems.trim().length<3||individualDeliveryAddress.trim().length<5||individualPhone.trim().length<7} onClick={submitIndividualRequest}>{individualSubmitting?"Отправляем заявку…":"Отправить заявку"}</button></>}
{page==="individual-success"&&<div className="success-state"><span><Check size={35}/></span><h1>Заявка отправлена!</h1><p>Индивидуальная заявка №{individualSuccessNumber||"—"} поступила оператору. Он проверит возможность покупки и свяжется с вами для согласования стоимости товаров и доставки.</p><button className="primary-button" onClick={()=>setPage("home")}>На главную</button></div>}
{page==="cart"&&<><button className="back-link" onClick={()=>setPage("home")}><ArrowLeft size={17}/> Продолжить покупки</button><div className="page-title"><span className="eyebrow dark">ВАШ ЗАКАЗ</span><h1>Корзина</h1></div>{!cart.length?<div className="empty-state"><span>🛍️</span><h2>Пока здесь пусто</h2><p>Добавьте товары из любого магазина Тимашевска.</p><button className="primary-button" onClick={()=>setPage("home")}>Выбрать товары</button></div>:<><div className="cart-store"><Store size={17}/><b>{cartShop?.name}</b><span>{count} шт.</span></div>{cart.map(p=><div className="cart-line" key={p.id}><span className="cart-emoji">{p.icon}</span><div className="cart-info"><b>{p.name}</b><small>{money(p.price)} / {p.unit}</small></div><div className="stepper"><button onClick={()=>changeQty(p.id,-1)}><Minus size={14}/></button><b>{p.qty}</b><button onClick={()=>changeQty(p.id,1)}><Plus size={14}/></button></div><strong>{money(p.price*p.qty)}</strong></div>)}<div className="total-row"><span>Товары</span><b>{money(total)}</b></div><div className="minimum-hint">{total<700?"До минимального заказа осталось "+money(700-total):"Минимальная сумма заказа выполнена"}</div><button className="primary-button full" disabled={total<700} onClick={()=>setPage("checkout")}>Перейти к оформлению <ArrowRight size={17}/></button><button className="text-button" onClick={()=>setCart([])}>Очистить корзину</button></>}</>}
{page==="checkout"&&<><button className="back-link" onClick={()=>setPage("cart")}><ArrowLeft size={17}/> Корзина</button><div className="page-title"><span className="eyebrow dark">ПОСЛЕДНИЙ ШАГ</span><h1>Куда доставить?</h1></div><div className="form-card"><div className="checkout-fields-row address-fields-row"><label>Улица<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Например, улица Ленина" autoComplete="address-line1"/></label><label>Дом<input value={house} onChange={e=>setHouse(e.target.value)} placeholder="Номер дома" autoComplete="address-line2"/></label></div><small className="address-hint">Укажите улицу и номер дома вручную — без ошибочных подсказок карты.</small><div className="checkout-fields-row"><label>Квартира<input value={apartment} onChange={e=>setApartment(e.target.value)} placeholder="№ квартиры" inputMode="numeric"/></label><label>Подъезд<input value={entrance} onChange={e=>setEntrance(e.target.value)} placeholder="№" inputMode="numeric"/></label><label>Этаж<input value={floor} onChange={e=>setFloor(e.target.value)} placeholder="№" inputMode="numeric"/></label></div><label>Номер телефона<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" autoComplete="tel"/></label><label>Комментарий курьеру<textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Домофон, ориентир или пожелания к доставке" rows="3"/></label></div><div className="checkout-summary"><div><span>Магазин</span><b>{cartShop?.name}</b></div><div><span>Товары</span><b>{money(total)}</b></div><div><span>Доставка</span><b>Рассчитаем и сообщим отдельно</b></div><p>Сначала отправится заявка. Оператор уточнит наличие и стоимость доставки, а заказ подтвердит после согласования итоговой суммы.</p></div><button className="primary-button full" disabled={isSubmitting||!address.trim()||!house.trim()||!phone.trim()||total<700} onClick={submitOrder}>{isSubmitting?"Отправляем заявку…":<>Отправить заявку · {money(total)}</>}</button></>}
{page==="success"&&<div className="success-state"><span><Check size={35}/></span><h1>Заказ принят!</h1><p>Заявка №{orders.find(o=>o.id===selectedOrder)?.orderNumber||"—"} отправлена оператору. Он уточнит наличие товаров и стоимость доставки, после чего подтвердит итоговую сумму.</p><button className="primary-button" onClick={()=>setPage("orders")}>Посмотреть заказы</button></div>}
{page==="orders"&&<><div className="page-title"><span className="eyebrow dark">ИСТОРИЯ ПОКУПОК</span><h1>Мои заказы</h1></div>{!orders.length?<div className="empty-state"><span>📦</span><h2>Заказов пока нет</h2><p>Оформленные заказы появятся здесь.</p></div>:orders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>Заказ №{o.orderNumber||String(o.id).slice(-6)}</b><span className="status-pill">{o.status}</span></div><small>{o.created} · {o.shopName}</small><div className="order-bottom"><b>{money(o.total)}</b><button onClick={()=>setSelectedOrder(selectedOrder===o.id?null:o.id)}>{selectedOrder===o.id?"Скрыть":"Подробнее"}</button></div>{selectedOrder===o.id&&<div className="order-details">{o.items.map(i=><p key={i.id}>{i.name} × {i.qty}</p>)}<p><MapPin size={13}/> {o.address}</p></div>}</article>)}</>}
{page==="profile"&&<><div className="page-title"><span className="eyebrow dark">ТИМ-ТИМ</span><h1>Профиль</h1></div><div className="profile-card"><span><UserRound size={28}/></span><div><b>Покупатель</b><small>Гость · демонстрационный режим</small></div></div><div className="profile-info"><p><MapPin size={17}/> Доставка по Тимашевску</p><p><Truck size={17}/> Ориентир по времени: 30–60 минут</p><p><ShoppingBag size={17}/> Минимальный заказ: 700 ₽</p></div><button className="text-button" onClick={()=>{setAdminError("");setPage("operator");if(adminAuthenticated)loadOperatorOrders()}}>Вход для оператора</button><p className="demo-note">Для реального запуска потребуются регистрация, сервер и подключение уведомлений.</p></>}
{page==="operator"&&<><div className="page-title"><span className="eyebrow dark">ЗАЩИЩЁННЫЙ ДОСТУП</span><h1>Панель оператора</h1></div>{!adminAuthenticated?<div className="form-card"><form onSubmit={loginOperator}><label>Пароль оператора<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password"/></label><button className="primary-button full" type="submit" disabled={!adminPassword}>Войти</button></form>{adminError&&<p className="operator-warning">{adminError}</p>}</div>:<><div className="operator-topbar"><b>Заказы с сервера · {adminOrders.length}</b><div><button className="text-button" onClick={loadOperatorOrders}>Обновить</button><button className="text-button" onClick={logoutOperator}>Выйти</button></div></div>{adminError&&<p className="operator-warning">{adminError}</p>}
<div className="operator-tabs"><button className={operatorTab==="orders"?"active":""} onClick={()=>setOperatorTab("orders")}>Заказы</button><button className={operatorTab==="individual"?"active":""} onClick={()=>setOperatorTab("individual")}>Индивидуальные · {adminIndividualRequests.length}</button><button className={operatorTab==="shops"?"active":""} onClick={()=>{setOperatorTab("shops");loadAdminCatalog()}}>Магазины</button><button className={operatorTab==="products"?"active":""} onClick={()=>{setOperatorTab("products");loadAdminCatalog()}}>Товары</button><button className={operatorTab==="brand"?"active":""} onClick={()=>setOperatorTab("brand")}>Логотип</button></div>
{operatorTab==="brand"&&<section className="operator-manager brand-manager"><h2>Логотип сайта</h2><p className="muted">Загрузите PNG, JPG или WebP до 900 КБ. Новый логотип сразу появится у всех посетителей сайта.</p><div className="brand-preview"><img src={brandLogo||"/timtim-logo.svg"} alt="Текущий логотип"/></div><label className="brand-upload">Выбрать изображение<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>saveBrandLogo(e.target.files?.[0])}/></label>{logoSaving&&<p className="muted">Сохраняем логотип…</p>}</section>}
{operatorTab==="individual"&&<section className="operator-manager"><h2>Индивидуальные заявки</h2>{!adminIndividualRequests.length?<p className="muted">Пока заявок нет</p>:adminIndividualRequests.map(r=><article className="order-card individual-request-card" key={r.id}><div className="order-top"><b>Заявка №{r.request_number}</b><span className="status-pill">{r.status}</span></div><small>{new Date(r.created_at).toLocaleString("ru-RU")}</small><p><b>Магазин:</b> {r.store_name}</p><p><b>Адрес магазина:</b> {r.store_address}</p><p><b>Что купить:</b></p><pre>{r.items_text}</pre><p><b>Доставка:</b> {r.delivery_address}</p><p><b>Телефон:</b> <a href={"tel:"+r.customer_phone}>{r.customer_phone}</a></p>{r.customer_comment&&<p><b>Комментарий:</b> {r.customer_comment}</p>}</article>)}</section>}
{operatorTab==="shops"&&<section className="operator-manager">
<h2>Магазины</h2>
<div className="manager-create"><input value={newShopName} onChange={e=>setNewShopName(e.target.value)} placeholder="Название магазина"/><select value={newShopCategory} onChange={e=>setNewShopCategory(e.target.value)}>{["Продукты","Цветы","Для дома","Зоотовары","Выпечка","Другое"].map(v=><option key={v}>{v}</option>)}</select><button className="primary-button" disabled={newShopName.trim().length<2} onClick={createAdminShop}>Добавить магазин</button></div>
{adminShops.map(shop=><div className="manager-row" key={shop.id}><input value={shop.name} onChange={e=>setAdminShops(old=>old.map(x=>x.id===shop.id?{...x,name:e.target.value}:x))}/><input value={shop.category} onChange={e=>setAdminShops(old=>old.map(x=>x.id===shop.id?{...x,category:e.target.value}:x))}/><label className="manager-active"><input type="checkbox" checked={shop.is_active} onChange={e=>setAdminShops(old=>old.map(x=>x.id===shop.id?{...x,is_active:e.target.checked}:x))}/> Активен</label><button className="text-button" onClick={()=>saveAdminShop(shop)}>Сохранить</button></div>)}
</section>}
{operatorTab==="products"&&<section className="operator-manager">
<h2>Товары</h2>
<div className="manager-create"><select value={newProductShop} onChange={e=>setNewProductShop(e.target.value)}><option value="">Выберите магазин</option>{adminShops.map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}</select><input value={newProductName} onChange={e=>setNewProductName(e.target.value)} placeholder="Название товара"/><input type="number" min="0" value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} placeholder="Цена, ₽"/><input value={newProductUnit} onChange={e=>setNewProductUnit(e.target.value)} placeholder="Единица"/><button className="primary-button" disabled={!newProductShop||newProductName.trim().length<2||newProductPrice===""||!newProductUnit.trim()} onClick={createAdminProduct}>Добавить товар</button></div>
{adminProducts.map(product=><div className="manager-product" key={product.id}><select value={product.shop_id} onChange={e=>setAdminProducts(old=>old.map(x=>x.id===product.id?{...x,shop_id:Number(e.target.value)}:x))}>{adminShops.map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}</select><input value={product.name} onChange={e=>setAdminProducts(old=>old.map(x=>x.id===product.id?{...x,name:e.target.value}:x))}/><input type="number" min="0" value={product.price_rub} onChange={e=>setAdminProducts(old=>old.map(x=>x.id===product.id?{...x,price_rub:Number(e.target.value)}:x))}/><input value={product.unit} onChange={e=>setAdminProducts(old=>old.map(x=>x.id===product.id?{...x,unit:e.target.value}:x))}/><label className="manager-active"><input type="checkbox" checked={product.is_active} onChange={e=>setAdminProducts(old=>old.map(x=>x.id===product.id?{...x,is_active:e.target.checked}:x))}/> В каталоге</label><button className="text-button" onClick={()=>saveAdminProduct(product)}>Сохранить</button></div>)}
</section>}
{operatorTab==="orders"&&<>{!adminOrders.length?<div className="empty-state"><span>📋</span><h2>Заказов пока нет</h2></div>:adminOrders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>№{o.order_number} · {o.shop_name}</b><span className="status-pill">{o.status}</span></div><small>{new Date(o.created_at).toLocaleString("ru-RU")}</small><p>{o.customer_phone} · {o.delivery_address}</p>{o.items.map((item,i)=><p key={i}>{item.name} × {item.qty} · {money(item.lineTotal)}</p>)}{o.customer_comment&&<p>Комментарий: {o.customer_comment}</p>}<div className="fee-editor"><label>Доставка, ₽<input type="number" min="0" max="10000" value={o.delivery_fee_rub??0} onChange={e=>setAdminOrders(old=>old.map(item=>item.id===o.id?{...item,delivery_fee_rub:Number(e.target.value)}:item))}/></label><button className="text-button" onClick={()=>saveDeliveryFee(o.id,o.delivery_fee_rub??0)}>Сохранить доставку</button></div><b>Итого: {money(o.items_total_rub+(o.delivery_fee_rub??0))}</b><select value={o.status} onChange={e=>changeOperatorStatus(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}</>}</>}</>}
</main>
{selectedProduct&&<div className="product-modal-backdrop" role="presentation" onClick={()=>setSelectedProduct(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={selectedProduct?.name||"Товар"} onClick={e=>e.stopPropagation()}><button className="product-modal-close" aria-label="Закрыть" onClick={()=>setSelectedProduct(null)}><X size={20}/></button><div className="product-modal-picture">{selectedProduct?.imageUrl?<img src={selectedProduct.imageUrl} alt={selectedProduct.name}/>:<span>{selectedProduct?.icon||"🥐"}</span>}</div><div className="product-modal-copy"><span className="product-modal-kicker">ХЛЕБНЫЙ ДВОРИК</span><h2>{selectedProduct?.name}</h2><small>{selectedProduct?.unit}</small>{selectedProduct?.description&&<p>{selectedProduct.description}</p>}<div className="product-modal-bottom"><strong>{selectedProduct?money(selectedProduct.price):""}</strong><button className="primary-button" onClick={()=>{if(selectedProduct)addProduct(selectedProduct);setSelectedProduct(null)}}><Plus size={17}/> Добавить</button></div></div></section></div>}
<nav className="bottom-nav"><button className={["home","shop"].includes(page)?"selected":""} onClick={()=>{setPage("home");setActiveShop(null)}}><Store/><small>Главная</small></button><button className={page==="orders"?"selected":""} onClick={()=>setPage("orders")}><Clock3/><small>Заказы</small></button><button className={page==="cart"||page==="checkout"?"selected":""} onClick={()=>setPage("cart")}><ShoppingBag/><small>Корзина{count?" · "+count:""}</small></button><button className={page==="profile"?"selected":""} onClick={()=>setPage("profile")}><UserRound/><small>Профиль</small></button></nav>
{notice&&<div className="toast">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
</div>}
createRoot(document.getElementById("root")).render(<App/>);
