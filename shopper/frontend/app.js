const API = '/api';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function formatPrice(v){ return Number(v).toFixed(2) + ' ₽'; }

async function loadProducts(){
  try{
    const res = await fetch(API + '/products');
    products = await res.json();
    renderProducts();
    renderCart();
  }catch(e){ console.error(e); document.getElementById('products').innerText = 'Ошибка загрузки'; }
}

function renderProducts(){
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach(p => {
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `
      <img src="${p.image_url}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="bottom"><strong>${formatPrice(p.price)}</strong><button data-id="${p.id}">В корзину</button></div>
    `;
    el.querySelector('button').addEventListener('click', ()=> addToCart(p.id));
    container.appendChild(el);
  });
}

function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }

function addToCart(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const idx = cart.findIndex(x=>x.id===id);
  if(idx>=0) cart[idx].qty += 1; else cart.push({ id, name: p.name, price: p.price, qty: 1 });
  saveCart(); renderCart();
}

function removeFromCart(id){ cart = cart.filter(x=>x.id!==id); saveCart(); renderCart(); }

function changeQty(id, delta){
  cart = cart.map(x => x.id===id ? { ...x, qty: Math.max(1, x.qty + delta) } : x);
  saveCart(); renderCart();
}

function renderCart(){
  const panel = document.getElementById('cartItems');
  panel.innerHTML = '';
  if(cart.length===0){ panel.innerHTML = '<p>Пусто</p>'; document.getElementById('total').innerText = 'Итого: 0 ₽'; return; }
  cart.forEach(item => {
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `
      <div style="flex:1">${item.name}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
        <div>${item.qty}</div>
        <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
        <div style="width:70px;text-align:right">${formatPrice(item.price * item.qty)}</div>
        <button style="background:#e74c3c;margin-left:8px" data-remove="${item.id}">Удалить</button>
      </div>
    `;
    panel.appendChild(div);
  });
  panel.querySelectorAll('[data-id]').forEach(btn => {
    btn.addEventListener('click', ()=> changeQty(Number(btn.dataset.id), Number(btn.dataset.delta)));
  });
  panel.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', ()=> removeFromCart(Number(btn.dataset.remove)));
  });
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  document.getElementById('total').innerText = 'Итого: ' + Number(total).toFixed(2) + ' ₽';
}

document.getElementById('checkoutBtn').addEventListener('click', async ()=>{
  if(cart.length===0){ alert('Корзина пуста'); return; }
  const customer = { name: 'Demo User' };
  try{
    const res = await fetch(API + '/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cart, customer }) });
    const data = await res.json();
    if(data.ok){ alert('Заказ принят (демо)'); cart = []; saveCart(); renderCart(); }
    else alert('Ошибка: ' + (data.error || 'unknown'));
  }catch(e){ alert('Ошибка отправки заказа'); console.error(e); }
});

window.addEventListener('load', loadProducts);
