(function(){

  /* ---------------- DATA ---------------- */
  let nextItemId = 9;
  let menuItems = [
    {id:1, name:'Masala Dosa', category:'Breakfast', price:60, veg:true, available:true},
    {id:2, name:'Idli', category:'Breakfast', price:40, veg:true, available:true},
    {id:3, name:'Chicken Biriyani', category:'Lunch', price:120, veg:false, available:true},
    {id:4, name:'Mutton Biriyani', category:'Lunch', price:200, veg:false, available:true},
    {id:5, name:'porotta',category:'Dinner',price:50,veg:false,available:true},
    {id:6, name:'Paneer Tikka', category:'Dinner', price:95, veg:true, available:true},
    {id:7, name:'Egg Curry + Roti', category:'Dinner', price:80, veg:false, available:true},
    {id:8, name:'Veg Cutlet', category:'Snacks', price:30, veg:true, available:true},
    {id:9, name:'Cold Coffee', category:'Snacks', price:35, veg:true, available:false},
    {id:10,name:'BreadOmlette',category:'Snacks',price:50,veg:false,available:true},
    {id:11,name:'Chicken Fried Rice',category:'Dinner',price:120,veg:false,available:true},
  ];

  let cart = {}; // id -> qty
  let orders = []; // {id, token, items:[{id,name,price,qty}], total, status, time}
  let nextOrderId = 1;
  let tokenCounter = 101;

  const STATUSES = ['Placed','Preparing','Out for Delivery','Delivered'];
  const CATEGORIES = ['All','Breakfast','Lunch','Dinner','Snacks'];
  let activeCategory = 'All';

  /* ---------------- ROLE TOGGLE ---------------- */
  const btnStudent = document.getElementById('btn-student');
  const btnAdmin = document.getElementById('btn-admin');
  const viewStudent = document.getElementById('view-student');
  const viewAdmin = document.getElementById('view-admin');

  btnStudent.addEventListener('click', () => switchRole('student'));
  btnAdmin.addEventListener('click', () => switchRole('admin'));

  function switchRole(role){
    const isStudent = role === 'student';
    btnStudent.classList.toggle('active', isStudent);
    btnAdmin.classList.toggle('active', !isStudent);
    viewStudent.classList.toggle('active', isStudent);
    viewAdmin.classList.toggle('active', !isStudent);
    if(!isStudent) renderAdmin();
  }

  /* ---------------- CATEGORY TABS ---------------- */
  const categoryTabsEl = document.getElementById('category-tabs');
  function renderCategoryTabs(){
    categoryTabsEl.innerHTML = CATEGORIES.map(cat =>
      `<button data-cat="${cat}" class="${cat===activeCategory?'active':''}">${cat}</button>`
    ).join('');
    categoryTabsEl.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        activeCategory = btn.dataset.cat;
        renderCategoryTabs();
        renderMenu();
      });
    });
  }

  /* ---------------- MENU (student) ---------------- */
  const menuGridEl = document.getElementById('menu-grid');
  function renderMenu(){
    const items = menuItems.filter(m => activeCategory==='All' || m.category===activeCategory);
    if(items.length===0){
      menuGridEl.innerHTML = `<div class="empty-state">No items in this category yet.</div>`;
      return;
    }
    menuGridEl.innerHTML = items.map(item => `
      <div class="menu-card ${item.available?'':'unavailable'}">
        <div class="card-top">
          <div><div class="cat">${item.category}</div></div>
          <div class="veg-dot ${item.veg?'':'nonveg'}"></div>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="card-bottom">
          <span class="price">₹${item.price}</span>
          <button class="add-btn" data-id="${item.id}" ${item.available?'':'disabled'}>
            ${item.available? 'Add' : 'Sold out'}
          </button>
        </div>
      </div>
    `).join('');
    menuGridEl.querySelectorAll('.add-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        cart[id] = (cart[id]||0) + 1;
        renderCart();
      });
    });
  }

  /* ---------------- CART / SLIP ---------------- */
  const cartItemsEl = document.getElementById('cart-items');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');
  const placeOrderBtn = document.getElementById('place-order-btn');

  function renderCart(){
    const ids = Object.keys(cart).filter(id => cart[id] > 0);
    if(ids.length===0){
      cartItemsEl.innerHTML = `<div class="empty-cart">Your slip is empty. Add something tasty!</div>`;
      cartCountEl.textContent = '0 ITEMS';
      cartTotalEl.textContent = '₹0';
      placeOrderBtn.disabled = true;
      return;
    }
    let total = 0, count = 0;
    cartItemsEl.innerHTML = ids.map(id=>{
      const item = menuItems.find(m=>m.id===Number(id));
      const qty = cart[id];
      total += item.price * qty;
      count += qty;
      return `
        <div class="slip-item">
          <span class="name">${escapeHtml(item.name)}</span>
          <div class="qty-controls">
            <button data-id="${id}" data-op="dec">−</button>
            <span>${qty}</span>
            <button data-id="${id}" data-op="inc">+</button>
          </div>
        </div>
      `;
    }).join('');
    cartCountEl.textContent = `${count} ITEM${count>1?'S':''}`;
    cartTotalEl.textContent = `₹${total}`;
    placeOrderBtn.disabled = false;

    cartItemsEl.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        if(btn.dataset.op==='inc') cart[id]++;
        else { cart[id]--; if(cart[id]<=0) delete cart[id]; }
        renderCart();
      });
    });
  }

  placeOrderBtn.addEventListener('click', ()=>{
    const ids = Object.keys(cart).filter(id => cart[id] > 0);
    if(ids.length===0) return;
    let total = 0;
    const items = ids.map(id=>{
      const item = menuItems.find(m=>m.id===Number(id));
      const qty = cart[id];
      total += item.price*qty;
      return {id:item.id, name:item.name, price:item.price, qty};
    });
    orders.unshift({
      id: nextOrderId++,
      token: tokenCounter++,
      items, total,
      status: STATUSES[0],
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    });
    cart = {};
    renderCart();
    renderMyOrders();
  });

  /* ---------------- MY ORDERS (student tracking) ---------------- */
  const myOrdersEl = document.getElementById('my-orders');
  function renderMyOrders(){
    if(orders.length===0){
      myOrdersEl.innerHTML = `<div class="empty-state">No orders placed yet. Your token will appear here once you order.</div>`;
      return;
    }
    myOrdersEl.innerHTML = orders.map(order=>{
      const stepIndex = STATUSES.indexOf(order.status);
      return `
        <div class="order-ticket">
          <div class="order-ticket-top">
            <div><div class="token">#${order.token}</div></div>
            <div class="order-meta">Placed at ${order.time}<br>₹${order.total} · ${order.items.length} item${order.items.length>1?'s':''}</div>
          </div>
          <div class="order-items-list">${order.items.map(i=>`${i.qty}× ${escapeHtml(i.name)}`).join(', ')}</div>
          <div class="stepper">
            ${STATUSES.map((s,i)=>`
              <div class="step ${i<stepIndex?'done':''} ${i===stepIndex?'current':''}">
                <div class="step-line"></div>
                <div class="dot"></div>
                <div class="label">${s}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---------------- ADMIN: add item ---------------- */
  const addItemForm = document.getElementById('add-item-form');
  addItemForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('i-name').value.trim();
    const price = Number(document.getElementById('i-price').value);
    const category = document.getElementById('i-cat').value;
    const veg = document.getElementById('i-veg').checked;
    if(!name || !price) return;
    menuItems.push({id: nextItemId++, name, category, price, veg, available:true});
    addItemForm.reset();
    document.getElementById('i-veg').checked = true;
    renderAdmin();
    renderMenu();
  });

  /* ---------------- ADMIN: item list ---------------- */
  const adminItemListEl = document.getElementById('admin-item-list');
  function renderAdminItemList(){
    if(menuItems.length===0){
      adminItemListEl.innerHTML = `<div class="empty-state">No menu items yet.</div>`;
      return;
    }
    adminItemListEl.innerHTML = menuItems.map(item=>`
      <div class="admin-row">
        <div>
          <div class="item-name">${escapeHtml(item.name)} · ₹${item.price}</div>
          <div class="item-cat">${item.category} · ${item.veg?'Veg':'Non-veg'}</div>
        </div>
        <div class="row-actions">
          <button class="tag-btn ${item.available?'on':''}" data-id="${item.id}" data-act="toggle">
            ${item.available?'Available':'Sold out'}
          </button>
          <button class="tag-btn danger" data-id="${item.id}" data-act="delete">Remove</button>
        </div>
      </div>
    `).join('');

    adminItemListEl.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        if(btn.dataset.act==='toggle'){
          const item = menuItems.find(m=>m.id===id);
          item.available = !item.available;
        } else {
          menuItems = menuItems.filter(m=>m.id!==id);
        }
        renderAdmin();
        renderMenu();
      });
    });
  }

  /* ---------------- ADMIN: orders ---------------- */
  const adminOrderListEl = document.getElementById('admin-order-list');
  function renderAdminOrderList(){
    if(orders.length===0){
      adminOrderListEl.innerHTML = `<div class="empty-state">No incoming orders yet.</div>`;
      return;
    }
    adminOrderListEl.innerHTML = orders.map(order=>`
      <div class="admin-order-row">
        <div class="aor-top">
          <span class="aor-token">Token #${order.token}</span>
          <select class="status-select" data-id="${order.id}">
            ${STATUSES.map(s=>`<option value="${s}" ${s===order.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="aor-items">${order.items.map(i=>`${i.qty}× ${escapeHtml(i.name)}`).join(', ')} — ₹${order.total} · ${order.time}</div>
      </div>
    `).join('');

    adminOrderListEl.querySelectorAll('.status-select').forEach(sel=>{
      sel.addEventListener('change', ()=>{
        const id = Number(sel.dataset.id);
        const order = orders.find(o=>o.id===id);
        order.status = sel.value;
        renderMyOrders();
      });
    });
  }

  function renderAdmin(){
    renderAdminItemList();
    renderAdminOrderList();
  }

  /* ---------------- utils ---------------- */
  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------- init ---------------- */
  renderCategoryTabs();
  renderMenu();
  renderCart();
  renderMyOrders();
  renderAdmin();

})();