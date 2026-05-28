// calendario.js actualizado
let eventos = [];
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    cargarEventos();
    // Menú hamburguesa (reutilizar)
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            sideMenu.classList.add('open');
            overlay.classList.add('show');
        });
        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            overlay.classList.remove('show');
        });
        overlay.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
});

async function cargarEventos() {
    try {
        const response = await fetch('calendario.json');
        if (!response.ok) throw new Error('No se pudo cargar calendario.json');
        const data = await response.json();
        eventos = data.eventos;
        generarCalendario(currentDate);
        generarResumen();
    } catch (error) {
        console.error(error);
        document.querySelector('.calendario-wrapper').innerHTML += `<div class="error-message">Error cargando el calendario: ${error.message}</div>`;
    }
}

function generarCalendario(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    // Ajuste para que la semana comience en sábado (getDay() donde 0 = domingo, 6 = sábado)
    // Queremos que el primer día de la semana sea sábado.
    // Si el primer día del mes es domingo (0), entonces la diferencia para que empiece en sábado es -1?
    // Mejor: Calculamos el índice de inicio basado en sábado = 0.
    // En JS getDay() dom=0, lun=1, ..., sáb=6.
    // Para convertir a índice donde sáb=0: (getDay() + 1) % 7
    let startIndex = (firstDay.getDay() + 1) % 7; // sáb=0, dom=1, ..., vie=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    let calendarHTML = '<table class="calendar-grid"><thead><tr>';
    const weekdays = ['Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    weekdays.forEach(day => calendarHTML += `<th>${day}</th>`);
    calendarHTML += '</tr></thead><tbody><tr>';
    
    let cellCount = 0;
    // Días del mes anterior
    for (let i = startIndex - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        calendarHTML += `<td class="old-month"><div class="day-number">${day}</div></td>`;
        cellCount++;
    }
    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const eventosDia = eventos.filter(ev => ev.fecha === dateStr);
        let eventBadges = '';
        let tooltip = '';
        let cellClass = '';
        if (eventosDia.length > 0) {
            cellClass = 'event-day';
            eventBadges = eventosDia.map(ev => `<span class="event-badge">${ev.nombre.substring(0,12)}</span>`).join('');
            const tooltipText = eventosDia.map(ev => `${ev.nombre}: ${ev.descripcion.substring(0,40)}`).join(' | ');
            tooltip = `<span class="event-tooltip">${tooltipText}</span>`;
        }
        calendarHTML += `<td class="${cellClass}"><div class="day-number">${d}</div><div class="event-indicator">${eventBadges}${tooltip}</div></td>`;
        cellCount++;
        if (cellCount % 7 === 0 && d !== daysInMonth) calendarHTML += '</tr><tr>';
    }
    // Días del mes siguiente
    const remainingCells = 42 - cellCount;
    for (let i = 1; i <= remainingCells; i++) {
        calendarHTML += `<td class="next-month"><div class="day-number">${i}</div></td>`;
        cellCount++;
        if (cellCount % 7 === 0) calendarHTML += '</tr><tr>';
    }
    calendarHTML += '</tr></tbody></table>';
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('monthYear').innerText = `${monthNames[month]} ${year}`;
    document.getElementById('calendarGridContainer').innerHTML = calendarHTML;
}

function generarResumen() {
    const resumenContainer = document.getElementById('resumenEventos');
    if (!eventos.length) {
        resumenContainer.innerHTML = '<div class="no-eventos">No hay eventos programados.</div>';
        return;
    }
    const eventosOrdenados = [...eventos].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    let html = '<div class="resumen-grid">';
    eventosOrdenados.forEach(ev => {
        const fechaObj = new Date(ev.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        html += `
            <div class="resumen-card">
                <div class="fecha">${fechaFormateada}</div>
                <h4>${escapeHtml(ev.nombre)}</h4>
                <p>${escapeHtml(ev.descripcion)}</p>
            </div>
        `;
    });
    html += '</div>';
    resumenContainer.innerHTML = html;
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

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generarCalendario(currentDate);
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generarCalendario(currentDate);
}