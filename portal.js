// portal.js
let recursos = [];
let currentFilter = "all";
let currentSearch = "";

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const suggestionsDiv = document.getElementById('suggestions');
const filterBtns = document.querySelectorAll('.filter-btn');
const menuLinks = document.querySelectorAll('.side-menu a');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');

async function cargarDatos() {
    try {
        const [carpetasResp, formsResp] = await Promise.all([
            fetch('carpetas.json'),
            fetch('formularios.json')
        ]);
        if (!carpetasResp.ok) throw new Error(`carpetas.json (${carpetasResp.status})`);
        if (!formsResp.ok) throw new Error(`formularios.json (${formsResp.status})`);
        const carpetas = await carpetasResp.json();
        const formularios = await formsResp.json();
        if (!Array.isArray(carpetas) || !Array.isArray(formularios)) {
            throw new Error('Los JSON deben ser arreglos');
        }
        recursos = [
            ...carpetas.map(item => ({
                tipo: 'carpeta',
                nombre: item.nombre,
                descripcion: item.descripcion || 'Carpeta de Google Drive',
                url: item.url,
                tags: item.tags || []
            })),
            ...formularios.map(item => ({
                tipo: 'formulario',
                nombre: item.nombre,
                descripcion: item.descripcion || 'Formulario Google Forms',
                url: item.url,
                tags: item.tags || []
            }))
        ];
        mostrarMensajeInicial();
    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `<div class="error-message">Error: ${error.message}<br><br>Posibles causas:<br>
        - Los archivos carpetas.json o formularios.json no existen.<br>
        - Estás abriendo el HTML con file:// (necesitas un servidor local).<br>
        - Los JSON tienen errores de sintaxis.</div>`;
    }
}

function mostrarMensajeInicial() {
    resultsContainer.innerHTML = `<div class="empty-state">Comienza tu búsqueda o selecciona un filtro</div>`;
}

function getSuggestionList() {
    const palabras = new Set();
    recursos.forEach(r => {
        palabras.add(r.nombre.toLowerCase());
        r.tags.forEach(tag => palabras.add(tag.toLowerCase()));
    });
    return Array.from(palabras);
}

function showSuggestions(term) {
    if (!term.trim() || term.length < 1) {
        suggestionsDiv.classList.remove('active');
        return;
    }
    const termLower = term.toLowerCase();
    const sugerencias = getSuggestionList().filter(p => p.includes(termLower)).slice(0, 8);
    if (sugerencias.length === 0) {
        suggestionsDiv.classList.remove('active');
        return;
    }
    suggestionsDiv.innerHTML = sugerencias.map(sug => `<div class="suggestion-item">${escapeHtml(sug)}</div>`).join('');
    suggestionsDiv.classList.add('active');
    document.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            searchInput.value = el.innerText;
            suggestionsDiv.classList.remove('active');
            realizarBusqueda();
            toggleClearButton();
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function toggleClearButton() {
    if (searchInput.value.length > 0) {
        clearSearchBtn.style.display = 'flex';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

function limpiarBusqueda() {
    searchInput.value = '';
    currentSearch = '';
    // Resetear filtro a 'all' pero sin mostrar resultados (panel vacío)
    currentFilter = 'all';
    // Quitar clase active de todos los botones de filtro
    filterBtns.forEach(btn => btn.classList.remove('active'));
    toggleClearButton();
    suggestionsDiv.classList.remove('active');
    // Mostrar solo el mensaje inicial, no los resultados
    mostrarMensajeInicial();
    searchInput.focus();
}

function aplicarFiltrosYBusqueda() {
    if (recursos.length === 0) return;
    
    let filtrados = recursos;
    if (currentFilter !== 'all') {
        filtrados = filtrados.filter(r => r.tipo === currentFilter);
    }
    if (currentSearch.trim() !== "") {
        const searchLower = currentSearch.toLowerCase();
        filtrados = filtrados.filter(r =>
            r.nombre.toLowerCase().includes(searchLower) ||
            r.descripcion.toLowerCase().includes(searchLower) ||
            (r.tags && r.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
    }
    
    if (filtrados.length === 0 && (currentSearch !== "" || currentFilter !== "all")) {
        resultsContainer.innerHTML = `<div class="empty-state">No se encontraron recursos para "${escapeHtml(currentSearch)}"</div>`;
    } else if (filtrados.length === 0) {
        mostrarMensajeInicial();
    } else {
        renderizarResultados(filtrados);
    }
}

function renderizarResultados(resultados) {
    resultsContainer.innerHTML = resultados.map(res => `
        <div class="card-result" data-url="${escapeHtml(res.url)}">
            <div class="badge-type">${res.tipo === 'carpeta' ? 'CARPETA DRIVE' : 'EXAMEN'}</div>
            <h3>${escapeHtml(res.nombre)}</h3>
            <p>${escapeHtml(res.descripcion)}</p>
            <div>${res.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        </div>
    `).join('');
    document.querySelectorAll('.card-result').forEach(card => {
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url && url !== '#') window.open(url, '_blank');
            else alert('Enlace no válido. Revisa el JSON.');
        });
    });
}

function realizarBusqueda() {
    currentSearch = searchInput.value;
    suggestionsDiv.classList.remove('active');
    aplicarFiltrosYBusqueda();
    toggleClearButton();
}

let debounceTimeout;
function onSearchInput() {
    clearTimeout(debounceTimeout);
    const term = searchInput.value;
    showSuggestions(term);
    toggleClearButton();
    debounceTimeout = setTimeout(() => {
        currentSearch = term;
        aplicarFiltrosYBusqueda();
    }, 300);
}

searchInput.addEventListener('input', onSearchInput);
searchBtn.addEventListener('click', realizarBusqueda);
clearSearchBtn.addEventListener('click', limpiarBusqueda);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') realizarBusqueda();
});
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.classList.remove('active');
    }
});

function setActiveFilterButton(selectedFilter) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    const targetBtn = Array.from(filterBtns).find(btn => btn.getAttribute('data-filter') === selectedFilter);
    if (targetBtn) targetBtn.classList.add('active');
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filterValue = btn.getAttribute('data-filter');
        if (filterValue === 'all') {
            currentFilter = 'all';
        } else if (filterValue === 'carpetas') {
            currentFilter = 'carpeta';
        } else if (filterValue === 'formularios') {
            currentFilter = 'formulario';
        }
        setActiveFilterButton(filterValue);
        aplicarFiltrosYBusqueda();
    });
});

// Manejador del menú lateral (solo para "Criterios de evaluación" usamos enlace real)
function handleMenuClick(event, moduleName, targetUrl) {
    event.preventDefault();
    if (targetUrl) {
        window.location.href = targetUrl;
    } else {
        alert(`Módulo "${moduleName}" en construcción. Próximamente disponible.`);
    }
    closeMenu();
}

// Asignar destinos a cada enlace del menú
const menuConfig = {
    "Recursos": null,
    "Criterios de evaluación": "criterios.html",
    "Calendario escolar": "calendario.html", 
    "Reglamento": null,
    "Otros sitios": null
};

menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const moduleName = link.textContent.trim();
        const targetUrl = menuConfig[moduleName];
        handleMenuClick(e, moduleName, targetUrl);
    });
});

function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('show');
}
function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('show');
}
hamburgerBtn.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// Inicialización
filterBtns.forEach(btn => btn.classList.remove('active'));
toggleClearButton();
cargarDatos();