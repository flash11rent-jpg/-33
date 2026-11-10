import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Store, Truck, UserRound, X } from "lucide-react";
import "./style.css";
const shops=[
{id:1,name:"Продукты у дома",category:"Продукты",icon:"🛒",time:"30–45 мин",description:"Всё необходимое на каждый день"},
{id:2,name:"Цветочный мир",category:"Цветы",icon:"💐",time:"40–60 мин",description:"Букеты и цветы для близких"},
{id:3,name:"Аптека рядом",category:"Аптеки",icon:"💊",time:"30–60 мин",description:"Товары аптечного ассортимента"},
{id:4,name:"Дом и уют",category:"Для дома",icon:"🏡",time:"40–60 мин",description:"Полезные мелочи для дома"}];
const products=[
{id:1,name:"Молоко 3,2%",price:95,shop:1,unit:"1 л",icon:"🥛"},{id:2,name:"Хлеб белый",price:45,shop:1,unit:"шт.",icon:"🍞"},{id:3,name:"Яйца С1",price:110,shop:1,unit:"10 шт.",icon:"🥚"},{id:4,name:"Бананы",price:130,shop:1,unit:"1 кг",icon:"🍌"},{id:5,name:"Сыр",price:220,shop:1,unit:"300 г",icon:"🧀"},
{id:6,name:"Букет цветов",price:1800,shop:2,unit:"букет",icon:"💐"},{id:7,name:"Ромашки",price:900,shop:2,unit:"букет",icon:"🌼"},{id:8,name:"Тюльпаны",price:1200,shop:2,unit:"букет",icon:"🌷"},
{id:9,name:"Витамины (пример)",price:250,shop:3,unit:"упаковка",icon:"🧴"},{id:10,name:"Средство для посуды",price:160,shop:4,unit:"шт.",icon:"🧽"},{id:11,name:"Бумажные полотенца",price:190,shop:4,unit:"упаковка",icon:"🧻"}];
const categories=["Все","Продукты","Цветы","Аптеки","Для дома"];
const statuses=["Новый","Подтверждён","Собирается","Готов","В пути","Доставлен","Отменён"];
const money=n=>new Intl.NumberFormat("ru-RU").format(n)+" ₽";
const API_URL="https://tim-tim-api.onrender.com";
function App(){
const [page,setPage]=useState("home"),[category,setCategory]=useState("Все"),[query,setQuery]=useState(""),[activeShop,setActiveShop]=useState(null),[cart,setCart]=useState([]),[address,setAddress]=useState(""),[phone,setPhone]=useState(""),[comment,setComment]=useState(""),[notice,setNotice]=useState(""),[selectedOrder,setSelectedOrder]=useState(null),[isSubmitting,setIsSubmitting]=useState(false),[adminPassword,setAdminPassword]=useState(""),[adminAuthenticated,setAdminAuthenticated]=useState(false),[adminOrders,setAdminOrders]=useState([]),[adminError,setAdminError]=useState("");
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
    setOrders(current=>current.map(item=>item.id===o.id?{...item,status:data.order.status,updatedAt:data.order.updated_at}:item));
   }catch{}
  }));
 };
 refresh();
 const timer=setInterval(refresh,30000);
 return()=>clearInterval(timer);
},[orders.filter(o=>o.trackingToken).map(o=>o.id+":"+o.status).join("|")]);
useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(""),2300);return()=>clearTimeout(id)},[notice]);
const total=cart.reduce((s,p)=>s+p.price*p.qty,0),count=cart.reduce((s,p)=>s+p.qty,0),cartShop=cart.length?shops.find(s=>s.id===cart[0].shop):null;
const visibleShops=shops.filter(s=>(category==="Все"||s.category===category)&&s.name.toLowerCase().includes(query.toLowerCase()));
const visibleProducts=useMemo(()=>activeShop?products.filter(p=>p.shop===activeShop.id&&p.name.toLowerCase().includes(query.toLowerCase())):[],[activeShop,query]);
function addProduct(p){if(cart.length&&cart[0].shop!==p.shop){setNotice("В корзине товары другого магазина. Сначала очистите корзину.");return}setCart(old=>{const f=old.find(x=>x.id===p.id);return f?old.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...old,{...p,qty:1}]});setNotice("Добавлено в корзину")}
function changeQty(id,d){setCart(old=>old.map(p=>p.id===id?{...p,qty:p.qty+d}:p).filter(p=>p.qty>0))}
async function submitOrder(){
 if(isSubmitting)return;
 if(total<700){setNotice("Минимальная сумма заказа — 700 ₽");return}
 if(!address.trim()||!phone.trim()){setNotice("Укажите адрес и телефон");return}
 if(!cartShop){setNotice("Не удалось определить магазин");return}
 setIsSubmitting(true);
 try{
  const response=await fetch(API_URL+"/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({shopId:cartShop.id,items:cart.map(p=>({productId:p.id,qty:p.qty})),phone,address,comment})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось отправить заказ. Попробуйте позже.");
  const serverOrder=data.order;
  const o={id:serverOrder.id,orderNumber:serverOrder.order_number,trackingToken:data.trackingToken,items:cart.map(p=>({...p})),total:serverOrder.total_rub,shopName:cartShop.name,address,phone,comment,status:serverOrder.status,created:new Date(serverOrder.created_at).toLocaleString("ru-RU")};
  setOrders(old=>[o,...old]);setCart([]);setAddress("");setPhone("");setComment("");setSelectedOrder(o.id);setPage("success");
 }catch(error){setNotice(error.message||"Ошибка соединения с сервером")}
 finally{setIsSubmitting(false)}
}
async function loadOperatorOrders(){
 try{
  const response=await fetch(API_URL+"/api/admin/orders",{credentials:"include"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось загрузить заказы");
  setAdminOrders(data.orders||[]);setAdminAuthenticated(true);setAdminError("");
 }catch(error){setAdminAuthenticated(false);setAdminError(error.message||"Ошибка загрузки")}
}
async function loginOperator(event){
 event.preventDefault();setAdminError("");
 try{
  const response=await fetch(API_URL+"/api/admin/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:adminPassword})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось войти");
  setAdminPassword("");await loadOperatorOrders();
 }catch(error){setAdminError(error.message||"Ошибка входа")}
}
async function changeOperatorStatus(id,status){
 try{
  const response=await fetch(API_URL+"/api/admin/orders/"+encodeURIComponent(id)+"/status",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Не удалось обновить статус");
  setAdminOrders(old=>old.map(o=>o.id===id?{...o,status:data.order.status}:o));
 }catch(error){setAdminError(error.message||"Ошибка обновления статуса")}
}
async function logoutOperator(){
 try{await fetch(API_URL+"/api/admin/logout",{method:"POST",credentials:"include"})}catch{}
 setAdminAuthenticated(false);setAdminOrders([]);setPage("profile");
}
return <div className="app-shell">
<header className="topbar"><button className="brand" onClick={()=>{setPage("home");setActiveShop(null)}}><span className="brand-mark">тт</span><span><b>Тим-Тим</b><small>Доставка из магазинов</small></span></button><button className="icon-button cart-top" onClick={()=>setPage("cart")} aria-label="Корзина"><ShoppingBag size={21}/>{count>0&&<i>{count}</i>}</button></header>
<main>
{page==="home"&&<><section className="hero"><div className="hero-copy"><span className="eyebrow">ТИМАШЕВСК · ДОСТАВКА</span><h1>Покупки —<br/>без лишних хлопот</h1><p>Заказывайте из магазинов города. Остальное мы берём на себя.</p><button className="hero-cta" onClick={()=>document.getElementById("shops")?.scrollIntoView({behavior:"smooth"})}>Выбрать магазин <ArrowRight size={16}/></button></div><div className="hero-bag">🛍️</div><div className="hero-orbit"/></section>
<div className="section-head" id="shops"><div><span className="eyebrow dark">ВЫБИРАЙТЕ УДОБНО</span><h2>Что доставить?</h2></div><span className="muted">По всему Тимашевску</span></div>
<div className="search-wrap"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти магазин или товар"/></div>
<div className="category-row">{categories.map(c=><button key={c} className={category===c?"category active":"category"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
<div className="section-head compact"><h2>Магазины</h2><span className="muted">{visibleShops.length} магазина</span></div>
<div className="shop-grid">{visibleShops.map(s=><button className="shop-card" key={s.id} onClick={()=>{setActiveShop(s);setPage("shop");setQuery("")}}><span className="shop-emoji">{s.icon}</span><span className="shop-category">{s.category}</span><b>{s.name}</b><small>{s.description}</small><span className="shop-foot"><Clock3 size={13}/>{s.time}<ArrowRight size={15}/></span></button>)}</div><p className="demo-note">Тестовый каталог. Цены и наличие подтверждаются оператором перед сборкой заказа.</p></>}
{page==="shop"&&activeShop&&<><button className="back-link" onClick={()=>{setPage("home");setQuery("")}}><ArrowLeft size={17}/> Все магазины</button><section className="store-hero"><span>{activeShop.icon}</span><div><small>{activeShop.category}</small><h1>{activeShop.name}</h1><p><Clock3 size={14}/> {activeShop.time} · Тимашевск</p></div></section><div className="section-head compact"><h2>Каталог</h2><span className="muted">{visibleProducts.length} товара</span></div><div className="product-grid">{visibleProducts.map(p=><article className="product-card" key={p.id}><div className="product-picture">{p.icon}</div><div className="product-details"><b>{p.name}</b><small>{p.unit}</small><strong>{money(p.price)}</strong></div><button className="add-button" onClick={()=>addProduct(p)}><Plus size={19}/></button></article>)}</div></>}
{page==="cart"&&<><button className="back-link" onClick={()=>setPage("home")}><ArrowLeft size={17}/> Продолжить покупки</button><div className="page-title"><span className="eyebrow dark">ВАШ ЗАКАЗ</span><h1>Корзина</h1></div>{!cart.length?<div className="empty-state"><span>🛍️</span><h2>Пока здесь пусто</h2><p>Добавьте товары из любого магазина Тимашевска.</p><button className="primary-button" onClick={()=>setPage("home")}>Выбрать товары</button></div>:<><div className="cart-store"><Store size={17}/><b>{cartShop?.name}</b><span>{count} шт.</span></div>{cart.map(p=><div className="cart-line" key={p.id}><span className="cart-emoji">{p.icon}</span><div className="cart-info"><b>{p.name}</b><small>{money(p.price)} / {p.unit}</small></div><div className="stepper"><button onClick={()=>changeQty(p.id,-1)}><Minus size={14}/></button><b>{p.qty}</b><button onClick={()=>changeQty(p.id,1)}><Plus size={14}/></button></div><strong>{money(p.price*p.qty)}</strong></div>)}<div className="total-row"><span>Товары</span><b>{money(total)}</b></div><div className="minimum-hint">{total<700?"До минимального заказа осталось "+money(700-total):"Минимальная сумма заказа выполнена"}</div><button className="primary-button full" disabled={total<700} onClick={()=>setPage("checkout")}>Перейти к оформлению <ArrowRight size={17}/></button><button className="text-button" onClick={()=>setCart([])}>Очистить корзину</button></>}</>}
{page==="checkout"&&<><button className="back-link" onClick={()=>setPage("cart")}><ArrowLeft size={17}/> Корзина</button><div className="page-title"><span className="eyebrow dark">ПОСЛЕДНИЙ ШАГ</span><h1>Куда доставить?</h1></div><div className="form-card"><label>Адрес доставки<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Улица, дом, квартира"/></label><label>Номер телефона<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel"/></label><label>Комментарий курьеру<textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Подъезд, этаж, домофон — по желанию" rows="3"/></label></div><div className="checkout-summary"><div><span>Магазин</span><b>{cartShop?.name}</b></div><div><span>Товары</span><b>{money(total)}</b></div><p>Стоимость и время доставки подтвердим перед отправкой заказа.</p></div><button className="primary-button full" disabled={isSubmitting} onClick={submitOrder}>{isSubmitting?"Отправляем заказ…":<>Подтвердить заказ · {money(total)}</>}</button></>}
{page==="success"&&<div className="success-state"><span><Check size={35}/></span><h1>Заказ принят!</h1><p>Заказ №{orders.find(o=>o.id===selectedOrder)?.orderNumber||"—"} сохранён на сервере. Оператор увидит заказ в рабочей панели и свяжется с вами для подтверждения наличия товаров и доставки.</p><button className="primary-button" onClick={()=>setPage("orders")}>Посмотреть заказы</button></div>}
{page==="orders"&&<><div className="page-title"><span className="eyebrow dark">ИСТОРИЯ ПОКУПОК</span><h1>Мои заказы</h1></div>{!orders.length?<div className="empty-state"><span>📦</span><h2>Заказов пока нет</h2><p>Оформленные заказы появятся здесь.</p></div>:orders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>Заказ №{String(o.id).slice(-6)}</b><span className="status-pill">{o.status}</span></div><small>{o.created} · {o.shopName}</small><div className="order-bottom"><b>{money(o.total)}</b><button onClick={()=>setSelectedOrder(selectedOrder===o.id?null:o.id)}>{selectedOrder===o.id?"Скрыть":"Подробнее"}</button></div>{selectedOrder===o.id&&<div className="order-details">{o.items.map(i=><p key={i.id}>{i.name} × {i.qty}</p>)}<p><MapPin size={13}/> {o.address}</p></div>}</article>)}</>}
{page==="profile"&&<><div className="page-title"><span className="eyebrow dark">ТИМ-ТИМ</span><h1>Профиль</h1></div><div className="profile-card"><span><UserRound size={28}/></span><div><b>Покупатель</b><small>Гость · демонстрационный режим</small></div></div><div className="profile-info"><p><MapPin size={17}/> Доставка по Тимашевску</p><p><Truck size={17}/> Ориентир по времени: 30–60 минут</p><p><ShoppingBag size={17}/> Минимальный заказ: 700 ₽</p></div><button className="text-button" onClick={()=>{setAdminError("");setPage("operator");if(adminAuthenticated)loadOperatorOrders()}}>Вход для оператора</button><p className="demo-note">Для реального запуска потребуются регистрация, сервер и подключение уведомлений.</p></>}
{page==="operator"&&<><div className="page-title"><span className="eyebrow dark">ЗАЩИЩЁННЫЙ ДОСТУП</span><h1>Панель оператора</h1></div>{!adminAuthenticated?<div className="form-card"><form onSubmit={loginOperator}><label>Пароль оператора<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password"/></label><button className="primary-button full" type="submit" disabled={!adminPassword}>Войти</button></form>{adminError&&<p className="operator-warning">{adminError}</p>}</div>:<><div className="operator-topbar"><b>Заказы с сервера · {adminOrders.length}</b><button className="text-button" onClick={logoutOperator}>Выйти</button></div>{adminError&&<p className="operator-warning">{adminError}</p>}{!adminOrders.length?<div className="empty-state"><span>📋</span><h2>Заказов пока нет</h2></div>:adminOrders.map(o=><article className="order-card" key={o.id}><div className="order-top"><b>№{o.order_number} · {o.shop_name}</b><span className="status-pill">{o.status}</span></div><small>{new Date(o.created_at).toLocaleString("ru-RU")}</small><p>{o.customer_phone} · {o.delivery_address}</p>{o.items.map((item,i)=><p key={i}>{item.name} × {item.qty} · {money(item.lineTotal)}</p>)}{o.customer_comment&&<p>Комментарий: {o.customer_comment}</p>}<b>{money(o.total_rub)}</b><select value={o.status} onChange={e=>changeOperatorStatus(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}</>}</>}
</main>
<nav className="bottom-nav"><button className={["home","shop"].includes(page)?"selected":""} onClick={()=>{setPage("home");setActiveShop(null)}}><Store/><small>Главная</small></button><button className={page==="orders"?"selected":""} onClick={()=>setPage("orders")}><Clock3/><small>Заказы</small></button><button className={page==="cart"||page==="checkout"?"selected":""} onClick={()=>setPage("cart")}><ShoppingBag/><small>Корзина{count?" · "+count:""}</small></button><button className={page==="profile"?"selected":""} onClick={()=>setPage("profile")}><UserRound/><small>Профиль</small></button></nav>
{notice&&<div className="toast">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
</div>}
createRoot(document.getElementById("root")).render(<App/>);
