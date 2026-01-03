let datos = {};
let categoriaActual = null;
let currentPage = 1;
let perPage = 12;
let currentList = [];

fetch('productos.json')
  .then(res => res.json())
  .then(json => {
    datos = json;
    initCategorias(Object.keys(json));
    const primera = Object.keys(json)[0];
    if (primera) mostrarCategoria(primera);
    document.getElementById('btnBuscar').addEventListener('click', aplicarBusqueda);
    document.getElementById('sortSelect').addEventListener('change', ()=> { currentPage = 1; aplicarFiltroYRender(); });
    document.getElementById('searchInput').addEventListener('keyup', (e)=> { if (e.key === 'Enter') aplicarBusqueda(); });
  })
  .catch(err => {
    console.error('Error cargando productos.json', err);
    document.getElementById('catalogo').innerHTML = '<div class="no-results">No se pudo cargar el catálogo.</div>';
  });

function initCategorias(keys){
  const cont = document.getElementById('categoriasButtons');
  cont.innerHTML = '';
  keys.forEach(k => {
    const btn = document.createElement('button');
    btn.textContent = k.charAt(0).toUpperCase() + k.slice(1);
    btn.addEventListener('click', ()=> mostrarCategoria(k));
    btn.dataset.cat = k;
    cont.appendChild(btn);
  });
  document.getElementById('btnFiltrar').addEventListener('click', ()=> { currentPage = 1; aplicarFiltroYRender(); });
}

function mostrarCategoria(cat) {
  categoriaActual = cat;
  currentPage = 1;
  Array.from(document.querySelectorAll('.categorias button')).forEach(b=> b.classList.toggle('active', b.dataset.cat===cat));
  aplicarFiltroYRender();
}

function aplicarBusqueda(){
  currentPage = 1;
  aplicarFiltroYRender();
}

function aplicarFiltroYRender(){
  const min = parseFloat(document.getElementById('precioMin').value) || 0;
  const maxVal = document.getElementById('precioMax').value;
  const max = maxVal === '' ? Infinity : parseFloat(maxVal);
  const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

  let base = [];
  if (categoriaActual) base = datos[categoriaActual] || [];
  else {
    // combine all
    base = Object.values(datos).flat();
  }

  let filtrados = base.filter(p => p.precio >= min && p.precio <= max);
  if (q) {
    filtrados = filtrados.filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q));
  }

  // sorting
  const sort = document.getElementById('sortSelect')?.value || 'default';
  if (sort === 'price-asc') filtrados.sort((a,b)=> a.precio - b.precio);
  if (sort === 'price-desc') filtrados.sort((a,b)=> b.precio - a.precio);

  currentList = filtrados;
  renderizarProductosPage(currentList, currentPage);
}

function renderizarProductosPage(lista, page){
  const contenedor = document.getElementById('catalogo');
  contenedor.innerHTML = '';

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = '<div class="no-results">No hay productos que mostrar.</div>';
    document.getElementById('resultInfo').textContent = '';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const total = lista.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (page > pages) page = pages;
  const start = (page - 1) * perPage;
  const slice = lista.slice(start, start + perPage);

  const grid = document.createElement('div');
  grid.className = 'catalog-grid';

  slice.forEach(p => {
    const card = document.createElement('article');
    card.className = 'producto';

    const imgwrap = document.createElement('div');
    imgwrap.className = 'imgwrap';

    const imgEl = document.createElement('img');
    imgEl.loading = 'lazy';
    const imgFile = String(p.imagen || '').replace(/\.svg$/i, '.jpg');
    imgEl.src = `img/${imgFile}`;
    imgEl.alt = p.nombre || '';
    imgEl.addEventListener('error', () => {
      if (!imgEl.dataset.fallback) {
        imgEl.dataset.fallback = '1';
        imgEl.src = 'img/aretes01.jpg';
      }
    });

    // optional discount badge if has descuento field
    if (p.descuento) {
      const badge = document.createElement('div');
      badge.className = 'badge-discount';
      badge.textContent = `-${p.descuento}%`;
      imgwrap.appendChild(badge);
    }

    const marca = document.createElement('div');
    marca.className = 'marca-agua';
    marca.textContent = 'Estilo & Glamour';

    imgwrap.appendChild(imgEl);
    imgwrap.appendChild(marca);

    const info = document.createElement('div');
    const oldPriceHtml = p.precio_old ? `<span class="old">S/ ${Number(p.precio_old).toFixed(2)}</span>` : '';
    info.innerHTML = `
      <h4>${p.nombre}</h4>
      <p class="desc">${p.descripcion || ''}</p>
      <div class="precio">${oldPriceHtml}<span class="now">S/ ${Number(p.precio).toFixed(2)}</span></div>
    `;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'actions-row';
    const a = document.createElement('a');
    a.className = 'consultar';
    a.href = `https://wa.me/51900008840?text=Hola,%20me%20interesa%20el%20producto%20${encodeURIComponent(p.codigo)}`;
    a.target = '_blank';
    a.textContent = 'Consultar';
    actionsRow.appendChild(a);

    card.appendChild(imgwrap);
    card.appendChild(info);
    card.appendChild(actionsRow);

    grid.appendChild(card);
  });

  contenedor.appendChild(grid);

  document.getElementById('resultInfo').textContent = `Mostrando ${start+1}-${Math.min(start+slice.length,total)} de ${total} resultados`;
  renderPagination(pages, page);
}

function renderPagination(pages, active){
  const cont = document.getElementById('pagination');
  cont.innerHTML = '';
  for (let i=1;i<=pages;i++){
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i===active) btn.disabled = true;
    btn.addEventListener('click', ()=> { currentPage = i; renderizarProductosPage(currentList, currentPage); });
    cont.appendChild(btn);
  }
}

// keep right-click allowed; accessibility and developer convenience

/* --------- Editor / Login (admin) --------- */
// admin credentials can be provided via `admin.json` in the site root.
let adminCreds = { user: 'admin', pass: 'admin123' };

function qs(id){ return document.getElementById(id); }

// helper: SHA-256 hex using SubtleCrypto
async function computeHashHex(str){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// try to load admin credentials from admin.json (insecure for public sites)
fetch('admin.json').then(r=>{
  if (!r.ok) throw new Error('no admin.json');
  return r.json();
}).then(j=>{
  if (!j) return;
  if (j.user) adminCreds.user = String(j.user);
  if (j.passHash) {
    adminCreds.passHash = String(j.passHash);
  } else if (j.pass) {
    // legacy plain pass in file: compute its hash in-memory
    computeHashHex(String(j.pass)).then(h=> adminCreds.passHash = h);
  }
}).catch(()=>{
  // keep defaults if no file found; compute hash for default
  computeHashHex(adminCreds.pass).then(h=> adminCreds.passHash = h);
});

// modal helpers
function showModal(){ const m = qs('loginModal'); m.classList.remove('hidden'); m.setAttribute('aria-hidden','false'); }
function hideModal(){ const m = qs('loginModal'); m.classList.add('hidden'); m.setAttribute('aria-hidden','true'); }
function showEditor(){ qs('editorSection').classList.remove('hidden'); }
function hideEditor(){ qs('editorSection').classList.add('hidden'); }

document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'btnLogin') showModal();
});

qs('loginCancel')?.addEventListener('click', ()=> hideModal());
qs('loginSubmit')?.addEventListener('click', async ()=>{
  const u = (qs('loginUser').value || '').trim();
  const p = (qs('loginPass').value || '').trim();
  const hash = await computeHashHex(p || '');
  if (u === adminCreds.user && adminCreds.passHash && hash === adminCreds.passHash) {
    hideModal();
    showEditor();
    initEditor();
  } else {
    alert('Credenciales incorrectas');
  }
});

qs('btnLogout')?.addEventListener('click', ()=>{
  hideEditor();
});

function initEditor(){
  const catSel = qs('editCategory');
  catSel.innerHTML = '';
  Object.keys(datos).forEach(c=>{
    const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
  });
  catSel.addEventListener('change', ()=> populateProductsForCategory(catSel.value));
  qs('editProduct').addEventListener('change', ()=> loadProductToForm(catSel.value, qs('editProduct').value));
  qs('btnSaveProd').addEventListener('click', saveProductFromForm);
  qs('btnAddProd').addEventListener('click', addNewProduct);
  qs('btnDeleteProd').addEventListener('click', deleteCurrentProduct);
  qs('btnDownloadJSON').addEventListener('click', ()=> downloadJSONCopy());
  qs('btnSaveLocal').addEventListener('click', ()=> { localStorage.setItem('productos_edited', JSON.stringify(datos)); alert('Guardado en LocalStorage'); });

  // if there is a local edited copy, load it to datos
  const local = localStorage.getItem('productos_edited');
  if (local) {
    try { datos = JSON.parse(local); } catch(e) { /* ignore */ }
  }

  // select first category by default
  if (catSel.options.length) {
    catSel.selectedIndex = 0;
    populateProductsForCategory(catSel.value);
  }
}

function populateProductsForCategory(cat){
  const prodSel = qs('editProduct'); prodSel.innerHTML = '';
  const list = datos[cat] || [];
  list.forEach(p=>{
    const o = document.createElement('option'); o.value = p.codigo; o.textContent = `${p.codigo} — ${p.nombre}`; prodSel.appendChild(o);
  });
  if (prodSel.options.length) { prodSel.selectedIndex = 0; loadProductToForm(cat, prodSel.value); }
  else { clearProductForm(); }
}

function loadProductToForm(cat, codigo){
  const p = (datos[cat] || []).find(x=> x.codigo === codigo);
  if (!p) return clearProductForm();
  qs('prodCodigo').value = p.codigo || '';
  qs('prodNombre').value = p.nombre || '';
  qs('prodPrecio').value = p.precio || '';
  qs('prodDescripcion').value = p.descripcion || '';
  qs('prodImagen').value = p.imagen || '';
}

function clearProductForm(){ qs('prodCodigo').value=''; qs('prodNombre').value=''; qs('prodPrecio').value=''; qs('prodDescripcion').value=''; qs('prodImagen').value=''; }

function saveProductFromForm(){
  const cat = qs('editCategory').value;
  const codigo = qs('prodCodigo').value;
  if (!cat) return alert('Seleccione una categoría');
  if (!codigo) return alert('Seleccione un producto o agregue uno nuevo');
  const list = datos[cat] || [];
  const idx = list.findIndex(x=> x.codigo === codigo);
  const updated = {
    codigo: codigo,
    nombre: qs('prodNombre').value,
    precio: Number(qs('prodPrecio').value) || 0,
    descripcion: qs('prodDescripcion').value,
    imagen: qs('prodImagen').value
  };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  datos[cat] = list;
  alert('Producto actualizado en memoria');
  aplicarFiltroYRender();
  populateProductsForCategory(cat);
}

function addNewProduct(){
  const cat = qs('editCategory').value;
  if (!cat) return alert('Seleccione una categoría');
  const list = datos[cat] || [];
  const codigo = generateCodigo(cat);
  const nuevo = { codigo, nombre: 'Nuevo producto', precio: 0, descripcion: '', imagen: '' };
  list.push(nuevo);
  datos[cat] = list;
  populateProductsForCategory(cat);
  qs('editProduct').value = codigo;
  loadProductToForm(cat, codigo);
}

function deleteCurrentProduct(){
  const cat = qs('editCategory').value;
  const codigo = qs('editProduct').value || qs('prodCodigo').value;
  if (!codigo) return alert('No hay producto seleccionado');
  if (!confirm('Eliminar producto ' + codigo + '?')) return;
  const list = datos[cat] || [];
  const idx = list.findIndex(x=> x.codigo === codigo);
  if (idx >= 0) list.splice(idx,1);
  datos[cat] = list;
  alert('Producto eliminado en memoria');
  aplicarFiltroYRender();
  populateProductsForCategory(cat);
}

function generateCodigo(cat){
  const prefix = (cat || 'P').substring(0,2).toUpperCase();
  const existing = Object.values(datos).flat().map(p=>p.codigo || '');
  let n = 1;
  let code = `${prefix}-${String(n).padStart(3,'0')}`;
  while (existing.includes(code)) { n++; code = `${prefix}-${String(n).padStart(3,'0')}`; }
  return code;
}

function downloadJSONCopy(){
  const text = JSON.stringify(datos, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'productos-edited.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// if there's an edited copy in LocalStorage, show indicator in console
if (localStorage.getItem('productos_edited')) console.info('Hay una copia de productos en LocalStorage.');

// LocalStorage indicator helpers
function showLocalIndicator(){ const el = qs('localCopyIndicator'); if (el) el.classList.remove('hidden'); }
function hideLocalIndicator(){ const el = qs('localCopyIndicator'); if (el) el.classList.add('hidden'); }

// Attach listeners after DOM is ready
document.addEventListener('DOMContentLoaded', ()=>{
  // show indicator if edited copy exists
  if (localStorage.getItem('productos_edited')) showLocalIndicator();

  // clear local copy handler
  const btnClear = qs('btnClearLocal');
  if (btnClear) btnClear.addEventListener('click', ()=>{
    if (!confirm('Eliminar la copia editada en LocalStorage?')) return;
    localStorage.removeItem('productos_edited');
    hideLocalIndicator();
    alert('Copia local eliminada');
    // reload datos from productos.json to restore original in-memory state
    fetch('productos.json').then(r=>r.json()).then(j=>{ datos = j; aplicarFiltroYRender(); });
  });
});