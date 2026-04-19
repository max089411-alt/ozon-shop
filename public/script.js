let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadProducts() {
    try {
        const res = await fetch('products.json');
        products = await res.json();
        renderProducts();
    } catch (err) {
        document.getElementById('products').innerHTML = '<p>⚠️ Ошибка загрузки товаров</p>';
    }
}

function renderProducts() {
    document.getElementById('products').innerHTML = products.map(p => `
        <div class="product">
            <img src="${p.img}" alt="${p.name}">
            <h3>${p.name}</h3>
            <div class="price">${p.price.toLocaleString('ru-RU')} ₽</div>
            <button onclick="addToCart(${p.id})">В корзину</button>
        </div>
    `).join('');
}

function addToCart(id) {
    const item = products.find(p => p.id === id);
    const inCart = cart.find(c => c.id === id);
    if (inCart) inCart.qty++;
    else cart.push({ ...item, qty: 1 });
    saveCart();
    updateCartUI();
}

function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(id);
        else { saveCart(); updateCartUI(); }
    }
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
    renderCartModal();
}

function renderCartModal() {
    const container = document.getElementById('cartItems');
    container.innerHTML = cart.length === 0 ? '<p>Корзина пуста</p>' : cart.map(i => `
        <div class="cart-item">
            <div><strong>${i.name}</strong><br>${i.price.toLocaleString('ru-RU')} ₽</div>
            <div class="cart-controls">
                <button onclick="changeQty(${i.id}, -1)">−</button>
                <span>${i.qty}</span>
                <button onclick="changeQty(${i.id}, 1)">+</button>
                <button onclick="removeFromCart(${i.id})" style="background:#e63946; color:white; margin-left:8px;">🗑️</button>
            </div>
        </div>
    `).join('');
    document.getElementById('cartTotal').textContent = 
        `${cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('ru-RU')} ₽`;
}

function toggleCart() {
    document.getElementById('cartModal').classList.toggle('active');
}

async function checkout() {
    if (cart.length === 0) return alert('Корзина пуста!');
    
    const btn = document.querySelector('.cart-footer button');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    try {
        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart })
        });
        
        if (res.ok) {
            alert('✅ Заказ отправлен! Мы свяжемся с вами.');
            cart = [];
            saveCart();
            updateCartUI();
            toggleCart();
        } else {
            throw new Error('Failed to send order');
        }
    } catch (err) {
        alert('️ Ошибка отправки заказа. Попробуйте позже.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

loadProducts();
updateCartUI();
