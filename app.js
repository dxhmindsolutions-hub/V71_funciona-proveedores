/* ===== ELEMENTOS DOM ===== */
const drawer        = document.getElementById("drawer");
const search        = document.getElementById("search");
const list          = document.getElementById("list");
const confirmModal  = document.getElementById("confirmModal");
const confirmText   = document.getElementById("confirmText");
const addItemBtn    = document.getElementById("addItemBtn");
const editBtn       = document.getElementById("editBtn");
const editButtons   = document.getElementById("editButtons");
const ticketModal   = document.getElementById("ticketModal");
const ticketList    = document.getElementById("ticketList");
const viewTicketBtn = document.getElementById("viewTicketBtn");

/* ===== MODO EDICIÓN ===== */
let editMode = false;
function toggleEditMode(){
  editMode = !editMode;
  if(editButtons) editButtons.style.display = editMode ? "flex" : "none";
  addItemBtn.style.display = editMode ? "block" : "none";
  editBtn.textContent = editMode ? "↩️ Volver" : "✏️ Editar";
  render();
}

/* ===== CATEGORÍAS ===== */
const categories = [
  "Aguas y refrescos",
  "Cerveza, vinos y licores",
  "Café y té",
  "Frutas y verduras",
  "Lácteos y huevos",
  "Carne",
  "Pescado",
  "Limpieza",
  "Congelados",
  "Asiático",
  "Otros"
];

let activeCat = categories[0];
let items = JSON.parse(localStorage.items || "[]");
let cart  = JSON.parse(localStorage.cart  || "[]");

let deleteIndex = null;
let deleteType  = null;

/* ===== ORDEN INTELIGENTE ===== */
function parseQty(name){
  const m = name.match(/([\d,.]+)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

function baseName(name){
  return name.replace(/[\d.,]+\s*(cl|l|litros?|kg|g)?/i, '').trim();
}

function sortItems(){
  items.sort((a, b) => {
    if(a.cat !== b.cat) return a.cat.localeCompare(b.cat, 'es', { sensitivity: 'base' });
    const baseA = baseName(a.name);
    const baseB = baseName(b.name);
    if(baseA !== baseB) return baseA.localeCompare(baseB, 'es', { sensitivity: 'base' });
    const qA = parseQty(a.name);
    const qB = parseQty(b.name);
    if(qA !== null && qB !== null) return qA - qB;
    if(qA !== null) return -1;
    if(qB !== null) return 1;
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });
}

/* ===== DRAWER ===== */
function toggleDrawer(){
  drawer.classList.toggle("open");
}

function renderDrawer(){
  drawer.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    if(cat === activeCat) btn.classList.add('active');
    btn.onclick = () => { activeCat = cat; toggleDrawer(); render(); };
    drawer.appendChild(btn);
  });
}

/* ===== RENDER PRINCIPAL ===== */
function render(){
  
  sortItems();
  editBtn.textContent = editMode ? "↩️ Volver" : "✏️ Editar";
  renderDrawer();

  const q = search.value.toLowerCase(); // <- esto faltaba
list.innerHTML = items
  .filter(i => q ? i.name.toLowerCase().includes(q) : i.cat === activeCat)
    .map((i, index) => `
      <div class="item">
        <span>
          ${i.name}
          ${q ? `<small style="color:#666">(${i.cat})</small>` : ""}
        </span>
        <div>
         ${editMode
  ? `<button class="del" onclick="askDeleteItem('${i.name.replace(/'/g,"\\'")}')">✕</button>
     <button class="edit" onclick="editItem(${index})">✏️</button>`
  : `<button class="add" onclick="showQtyModal('${i.name.replace(/'/g,"\\'")}')">+</button>`}

        </div>
      </div>
    `).join("");

  renderTicket();
  localStorage.items = JSON.stringify(items);
  localStorage.cart  = JSON.stringify(cart);
}

function editItem(index){
  const item = items[index];
  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>Editar artículo</h3>
      <input id="iname" value="${item.name}" placeholder="Nombre">
      <select id="icat">
        ${categories.map(c => `<option ${c===item.cat ? 'selected' : ''}>${c}</option>`).join("")}
      </select>
      <div>
        <button id="save">Guardar</button>
        <button id="cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#save").onclick = () => {
    const n = m.querySelector("#iname").value.trim();
    const c = m.querySelector("#icat").value;
    if(n){
      items[index].name = n;
      items[index].cat = c;
      m.remove();
      render();
    }
  };
}


/* ===== NUEVO ARTÍCULO ===== */
function showAddItem(){
  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>Nuevo artículo</h3>
      <input id="iname" placeholder="Nombre">
      <select id="icat">
        ${categories.map(c => `<option>${c}</option>`).join("")}
      </select>
      <div>
        <button id="save">Guardar</button>
        <button id="cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#save").onclick = () => {
    const n = m.querySelector("#iname").value.trim();
    const c = m.querySelector("#icat").value;
    if(n){ items.push({ name: n, cat: c }); m.remove(); render(); }
  };
}

/* ===== MODAL CANTIDAD ===== */
function showQtyModal(name){
  let qty = 1;
  let unit = "UNIDAD";

  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>${name}</h3>
      <p>Cantidad</p>
      <div class="btns qty">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button>${n}</button>`).join('')}</div>
      <p>Unidad</p>
      <div class="btns unit">
        <button class="active">UNIDAD</button>
        <button>KG</button>
        <button>CAJA</button>
      </div>
      <div>
        <button id="add">Añadir</button>
        <button id="cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelectorAll(".qty button").forEach(b=>{
    b.onclick = ()=>{ m.querySelectorAll(".qty button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); qty=+b.textContent; };
  });
  m.querySelectorAll(".unit button").forEach(b=>{
    b.onclick = ()=>{ m.querySelectorAll(".unit button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); unit=b.textContent; };
  });

  m.querySelector("#cancel").onclick = ()=> m.remove();
  m.querySelector("#add").onclick = ()=>{
    const found = cart.find(c=>c.name===name && c.unit===unit);
    if(found) found.qty+=qty;
    else cart.push({ name, qty, unit });
    m.remove();
    render();
  };
}

/* ===== TICKET ===== */
function renderTicket(){
  ticketList.innerHTML = cart.map((c,i)=>`
    <li>
      <span>${c.name}</span>
      <span>${c.qty} ${c.unit}</span>
      <button class="del" onclick="askDeleteTicket(${i})">✕</button>
    </li>
  `).join("");

  updateTicketCounter();
}

/* ===== ELIMINAR ===== */
function askDeleteItem(name){
  deleteType = "item"; deleteIndex = items.findIndex(i=>i.name===name);
  confirmText.textContent = `¿Eliminar ${name}?`; confirmModal.style.display="flex";
}
function askDeleteTicket(i){
  deleteType = "ticket"; deleteIndex = i;
  confirmText.textContent = `¿Eliminar ${cart[i].name}?`; confirmModal.style.display="flex";
}
function askResetTicket(){
  deleteType="reset"; confirmText.textContent="¿Eliminar ticket de pedido?"; confirmModal.style.display="flex";
}
function confirmDelete(){
  if(deleteType==="item") items.splice(deleteIndex,1);
  if(deleteType==="ticket") cart.splice(deleteIndex,1);
  if(deleteType==="reset") cart=[];
  closeConfirm(); render();
}
function closeConfirm(){ confirmModal.style.display="none"; }

/* ===== BOTÓN MODAL TICKET ===== */
function openTicketModal(){ ticketModal.style.display="flex"; }
function closeTicketModal(){ ticketModal.style.display="none"; }

// mostrar líneas en el botón flotante
function updateTicketCounter(){
  const total = cart.length; // por líneas, no cantidad total
  viewTicketBtn.textContent = `🧾 Ver Ticket [ ${String(total).padStart(2,"0")} ]`;
  viewTicketBtn.style.display = total ? "block" : "none";
}

/* ===== IMPRIMIR ===== */
function printTicket(){
  const container = document.getElementById("print-ticket");
  const fecha = document.getElementById("ticket-fecha");
  const itemsContainer = document.getElementById("ticket-items");

  // fecha actual
  fecha.textContent = new Date().toLocaleString();

  // vaciar contenido previo
  itemsContainer.innerHTML = "";

  // añadir cada línea del ticket
  cart.forEach(c => {
    const div = document.createElement("div");
    div.innerHTML = `<span>${c.name}</span><span>${c.qty} ${c.unit}</span>`;
    itemsContainer.appendChild(div);
  });

  // mostrar, imprimir y ocultar
  container.style.display = "block";
  window.print();
  container.style.display = "none";
}


/* ===== WHATSAPP ===== */
function buildWhatsAppText(){
  let txt = "🧾 *PEDIDO*\n\n";
  categories.forEach(cat=>{
    const lines = cart.filter(c=>items.find(i=>i.name===c.name && i.cat===cat));
    if(lines.length){
      txt += cat.toUpperCase() + "\n";
      lines.forEach(l=>{ txt += `- ${l.name}: ${l.qty} ${l.unit}\n`; });
      txt += "\n";
    }
  });
  return txt.trim();
}

function previewWhatsApp(){
  const m = document.createElement("div");
  m.className="modal"; m.style.display="flex";
  m.innerHTML = `<div class="box">
    <h3>Vista previa WhatsApp</h3>
    <textarea style="width:100%;height:200px">${buildWhatsAppText()}</textarea>
    <div>
      <button id="cancel">Cancelar</button>
      <button id="send">Enviar</button>
    </div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector("#cancel").onclick = ()=> m.remove();
  m.querySelector("#send").onclick = ()=>{
    const txt = m.querySelector("textarea").value;
    window.open("https://wa.me/?text="+encodeURIComponent(txt));
    m.remove();
  };
}
function sendWhatsApp(){ previewWhatsApp(); }

/* ===== EXPORTAR / IMPORTAR ===== */
function exportData(){
  const data={items, cart};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="backup_despensa.json"; a.click();
  URL.revokeObjectURL(url);
}
function importData(event){
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload = e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.items && data.cart){ items=data.items; cart=data.cart; render(); alert("Datos restaurados correctamente ✅"); }
      else alert("Archivo inválido ⚠️");
    } catch{ alert("Error leyendo el archivo ⚠️"); }
  };
  reader.readAsText(file);
}

let items = JSON.parse(localStorage.items || "[]");

// Si no hay items en localStorage, inicializa con algunos
if(items.length === 0){
  items=[
    { name:"Agua 50cl", cat:"Aguas y refrescos" },
    { name:"Agua 1,25 litros", cat:"Aguas y refrescos" },
    { name:"Coca Cola", cat:"Aguas y refrescos" }
  ];
}

search.addEventListener('input', render);

/* ===== INICIALIZAR ===== */
render();
