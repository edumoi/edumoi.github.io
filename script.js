let datos = {};
let categoriaActual = null;

fetch('productos.json')
  .then(res => res.json())
  .then(json => {
    datos = json;
    initCategorias(Object.keys(json));
    const primera = Object.keys(json)[0];
    if (primera) mostrarCategoria(primera);
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
  document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltro);
}

function mostrarCategoria(cat) {
  categoriaActual = cat;
  Array.from(document.querySelectorAll('.categorias button')).forEach(b=> b.classList.toggle('active', b.dataset.cat===cat));
  const list = datos[cat] || [];
  renderizarProductos(list);
}

function aplicarFiltro() {
  if (!categoriaActual) return;
  const min = parseFloat(document.getElementById('precioMin').value) || 0;
  const maxVal = document.getElementById('precioMax').value;
  const max = maxVal === '' ? Infinity : parseFloat(maxVal);

  const filtrados = (datos[categoriaActual] || []).filter(p =>
    p.precio >= min && p.precio <= max
  );

  renderizarProductos(filtrados);
}

function renderizarProductos(lista) {
  const contenedor = document.getElementById('catalogo');
  contenedor.innerHTML = '';

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = '<div class="no-results">No hay productos que mostrar.</div>';
    return;
  }

  lista.forEach(p => {
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

    const marca = document.createElement('div');
    marca.className = 'marca-agua';
    marca.textContent = 'Estilo & Glamour';

    imgwrap.appendChild(imgEl);
    imgwrap.appendChild(marca);

    const info = document.createElement('div');
    info.innerHTML = `
      <h4>${p.nombre}</h4>
      <p class="desc">${p.descripcion || ''}</p>
      <div class="precio">S/ ${Number(p.precio).toFixed(2)}</div>
      <a class="consultar" href="https://wa.me/51900008840?text=Hola,%20me%20interesa%20el%20producto%20${encodeURIComponent(p.codigo)}" target="_blank">Consultar</a>
    `;

    card.appendChild(imgwrap);
    card.appendChild(info);

    contenedor.appendChild(card);
  });
}

// keep right-click allowed; accessibility and developer convenience