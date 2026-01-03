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