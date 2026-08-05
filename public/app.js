// Memoria interna de la aplicación
let maestrosData = { docentes: [], materias: [], gestiones: [] };
let asistenciasData = [];

// Variables de edición
let docenteEditId = null;
let materiaEditId = null;
let gestionEditId = null;
let asistenciaEditId = null;

// Modos de carga en Admin (individual / masivo)
let materiaBulkMode = false;

// Estado del filtro rápido por tarjetas
let currentStatsFilter = 'todos';

// Elementos del DOM
const fechaInput = document.getElementById('fecha');
const currentDateBadge = document.getElementById('current-date-badge');
const gestionSelect = document.getElementById('gestion_id');

// Autocomplete Docentes
const docenteBuscarInput = document.getElementById('docente_buscar');
const docenteIdInput = document.getElementById('docente_id');
const clearDocenteBtn = document.getElementById('clear-docente-btn');
const docenteSuggestions = document.getElementById('docente-suggestions');

// Autocomplete Materias
const materiaBuscarInput = document.getElementById('materia_buscar');
const materiaIdInput = document.getElementById('materia_id');
const clearMateriaBtn = document.getElementById('clear-materia-btn');
const materiaSuggestions = document.getElementById('materia-suggestions');

const programaInput = document.getElementById('programa');

const dictoSiRadio = document.getElementById('dicto_si');
const dictoNoRadio = document.getElementById('dicto_no');
const classDetailsContainer = document.getElementById('class-details-container');

const claseSelect = document.getElementById('clase');
const idiomaDictadoSelect = document.getElementById('idioma_dictado');
const reposicionSelect = document.getElementById('reposicion');
const inicioSelect = document.getElementById('inicio');
const atrasoMinutesGroup = document.getElementById('atraso-minutes-group');
const minutosAtrasoInput = document.getElementById('minutos_atraso');

const finalClaseSelect = document.getElementById('final_clase');
const finalMinutesGroup = document.getElementById('final-minutes-group');
const minutosFinalInput = document.getElementById('minutos_final');
const minutosFinalLabel = document.getElementById('minutos_final_label');

const comentariosTextarea = document.getElementById('comentarios');
const form = document.getElementById('attendance-form');
const submitBtn = document.getElementById('submit-btn');
const btnSpinner = document.getElementById('btn-spinner');
const cancelAttendanceEditBtn = document.getElementById('cancel-attendance-edit-btn');

// Estadísticas
const statTotal = document.getElementById('stat-total');
const statDictadas = document.getElementById('stat-dictadas');
const statAtraso = document.getElementById('stat-atraso');
const statSinDictar = document.getElementById('stat-sin-dictar');
const statSinDictarHoy = document.getElementById('stat-sin-dictar-hoy');

// Tabla Principal
const attendanceTbody = document.getElementById('attendance-tbody');

// Botones de exportación
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');

// Filtro de fecha
const filterDateInput = document.getElementById('filter-date');
const clearFilterBtn = document.getElementById('clear-filter-btn');

// Filtro de materia
const filterMateriaInput = document.getElementById('filter-materia');
const clearMateriaFilterBtn = document.getElementById('clear-materia-filter-btn');

// Conmutador de tema
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

// Pantalla Completa Historial
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenIcon = document.getElementById('fullscreen-icon');
const dataCard = document.querySelector('.data-card');

// Cajas de estadísticas rápidas para filtrado
const boxTotal = document.getElementById('box-stat-total');
const boxDictadas = document.getElementById('box-stat-dictadas');
const boxAtrasos = document.getElementById('box-stat-atrasos');
const boxSinDictar = document.getElementById('box-stat-sin-dictar');
const boxSinDictarHoy = document.getElementById('box-stat-sin-dictar-hoy');
const boxStatsElements = [boxTotal, boxDictadas, boxAtrasos, boxSinDictar, boxSinDictarHoy];

// Toast Notification
const toast = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// --- Elementos de Administración ---
const openAdminBtn = document.getElementById('open-admin-btn');
const closeAdminBtn = document.getElementById('close-admin-btn');
const adminModal = document.getElementById('admin-modal');

// Docentes Admin
const docentesSingleModeBtn = document.getElementById('docentes-single-mode-btn');
const docentesBulkModeBtn = document.getElementById('docentes-bulk-mode-btn');
const newDocenteForm = document.getElementById('new-docente-form');
const newDocenteNombre = document.getElementById('new_docente_nombre');
const docenteSubmitBtn = document.getElementById('docente-submit-btn');
const cancelDocenteEditBtn = document.getElementById('cancel-docente-edit-btn');
const bulkDocenteForm = document.getElementById('bulk-docente-form');
const bulkDocentesLista = document.getElementById('bulk_docentes_lista');
const adminDocentesList = document.getElementById('admin-docentes-list');

// Materias Admin
const materiasSingleModeBtn = document.getElementById('materias-single-mode-btn');
const materiasBulkModeBtn = document.getElementById('materias-bulk-mode-btn');
const newMateriaForm = document.getElementById('new-materia-form');
const materiaNombreGroup = document.getElementById('materia-nombre-group');
const newMateriaNombre = document.getElementById('new_materia_nombre');
const materiaBulkGroup = document.getElementById('materia-bulk-group');
const bulkMateriasLista = document.getElementById('bulk_materias_lista');
const newMateriaPrograma = document.getElementById('new_materia_programa');
const newMateriaIdioma = document.getElementById('new_materia_idioma');
const materiaSubmitBtn = document.getElementById('materia-submit-btn');
const cancelMateriaEditBtn = document.getElementById('cancel-materia-edit-btn');
const adminMateriasList = document.getElementById('admin-materias-list');

// Gestiones Admin
const newGestionForm = document.getElementById('new-gestion-form');
const newGestionNombre = document.getElementById('new_gestion_nombre');
const gestionSubmitBtn = document.getElementById('gestion-submit-btn');
const cancelGestionEditBtn = document.getElementById('cancel-gestion-edit-btn');
const adminGestionesList = document.getElementById('admin-gestiones-list');

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // 0. Cargar preferencia de tema (Claro/Oscuro)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggleIcon.setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('light-theme');
    themeToggleIcon.setAttribute('data-lucide', 'sun');
  }

  // 1. Establecer fecha de hoy
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  let mm = hoy.getMonth() + 1;
  let dd = hoy.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const fechaHoyString = `${yyyy}-${mm}-${dd}`;
  fechaInput.value = fechaHoyString;
  
  // Badge de fecha en el Header
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateBadge.textContent = hoy.toLocaleDateString('es-ES', opcionesFecha);

  // 2. Cargar datos maestros (docentes, materias y gestiones)
  await cargarDatosMaestros();

  // 3. Inicializar autocompletados
  setupAutocompletes();

  // 4. Cargar historial de asistencias
  await cargarAsistencias();

  // 5. Registrar Event Listeners generales y de administración
  registrarEventListeners();
  
  // Re-inicializar iconos de Lucide
  lucide.createIcons();
}

// Cargar docentes, materias y gestiones académicas del Backend
async function cargarDatosMaestros() {
  try {
    const res = await fetch('/api/maestros');
    if (!res.ok) throw new Error('Error al conectar con la API de maestros');
    maestrosData = await res.json();
    
    // Rellenar select de Gestión Académica en el formulario principal
    rellenarSelectGestiones();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Rellenar select de gestiones en formulario principal
function rellenarSelectGestiones() {
  gestionSelect.innerHTML = '';
  if (!maestrosData.gestiones || maestrosData.gestiones.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = "Crea una gestión en Ajustes...";
    opt.disabled = true;
    opt.selected = true;
    gestionSelect.appendChild(opt);
    return;
  }

  maestrosData.gestiones.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.nombre;
    if (g.activa === 1) {
      opt.selected = true;
    }
    gestionSelect.appendChild(opt);
  });
}

// Configurar los autocompletados con inputs editables y dinámicos (usando getters dinámicos)
function setupAutocompletes() {
  // Autocomplete Docentes
  setupAutocomplete({
    inputElement: docenteBuscarInput,
    hiddenElement: docenteIdInput,
    clearBtn: clearDocenteBtn,
    suggestionsContainer: docenteSuggestions,
    getDataList: () => maestrosData.docentes,
    searchField: 'nombre',
    getDisplayValue: (item) => item.nombre,
    getSubtitleValue: null,
    onSelectCallback: null,
    onClearCallback: null
  });

  // Autocomplete Materias
  setupAutocomplete({
    inputElement: materiaBuscarInput,
    hiddenElement: materiaIdInput,
    clearBtn: clearMateriaBtn,
    suggestionsContainer: materiaSuggestions,
    getDataList: () => maestrosData.materias,
    searchField: 'nombre',
    getDisplayValue: (item) => item.nombre,
    getSubtitleValue: (item) => `Programa: ${item.programa} | Idioma predeterminado: ${item.idioma_predeterminado}`,
    onSelectCallback: (item) => {
      programaInput.value = item.programa;
      if (item.idioma_predeterminado) {
        idiomaDictadoSelect.value = item.idioma_predeterminado;
      }
    },
    onClearCallback: () => {
      programaInput.value = '';
    }
  });
}

// Función helper para remover acentos y pasar a minúsculas
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Función genérica para implementar autocompletado en un input
function setupAutocomplete({
  inputElement,
  hiddenElement,
  clearBtn,
  suggestionsContainer,
  getDataList,
  searchField = 'nombre',
  getDisplayValue = (item) => item.nombre,
  getSubtitleValue = null,
  onSelectCallback = null,
  onClearCallback = null
}) {
  let highlightedIndex = -1;
  let filteredItems = [];

  const updateSuggestions = () => {
    const query = inputElement.value.trim();
    suggestionsContainer.innerHTML = '';
    highlightedIndex = -1;
    
    const currentList = getDataList();

    if (!query) {
      suggestionsContainer.style.display = 'none';
      clearBtn.style.display = 'none';
      hiddenElement.value = '';
      if (onClearCallback) onClearCallback();
      return;
    }

    clearBtn.style.display = 'flex';

    // Filtrar coincidencias (insensible a mayúsculas, minúsculas y acentos)
    const normalizedQuery = normalizeText(query);
    filteredItems = currentList.filter(item => {
      const valueToSearch = getDisplayValue(item);
      return normalizeText(valueToSearch).includes(normalizedQuery);
    });

    if (filteredItems.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'suggestion-item';
      emptyDiv.style.cursor = 'default';
      emptyDiv.style.fontStyle = 'italic';
      emptyDiv.style.color = 'var(--text-muted)';
      emptyDiv.textContent = 'Sin resultados';
      suggestionsContainer.appendChild(emptyDiv);
      suggestionsContainer.style.display = 'block';
      return;
    }

    filteredItems.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'suggestion-item';
      itemDiv.dataset.index = index;

      const titleSpan = document.createElement('span');
      titleSpan.textContent = getDisplayValue(item);
      itemDiv.appendChild(titleSpan);

      if (getSubtitleValue) {
        const subtitleSpan = document.createElement('span');
        subtitleSpan.className = 'suggestion-subtitle';
        subtitleSpan.textContent = getSubtitleValue(item);
        itemDiv.appendChild(subtitleSpan);
      }

      itemDiv.addEventListener('click', () => {
        selectItem(item);
      });

      suggestionsContainer.appendChild(itemDiv);
    });

    suggestionsContainer.style.display = 'block';
  };

  const selectItem = (item) => {
    inputElement.value = getDisplayValue(item);
    hiddenElement.value = item.id;
    suggestionsContainer.style.display = 'none';
    clearBtn.style.display = 'flex';
    inputElement.setCustomValidity('');
    if (onSelectCallback) onSelectCallback(item);
  };

  const clearSelection = () => {
    inputElement.value = '';
    hiddenElement.value = '';
    suggestionsContainer.style.display = 'none';
    clearBtn.style.display = 'none';
    inputElement.setCustomValidity('');
    if (onClearCallback) onClearCallback();
  };

  // Event Listeners
  inputElement.addEventListener('input', updateSuggestions);
  
  inputElement.addEventListener('focus', () => {
    const currentList = getDataList();
    if (inputElement.value.trim() !== '') {
      updateSuggestions();
    } else {
      filteredItems = [...currentList];
      suggestionsContainer.innerHTML = '';
      
      filteredItems.slice(0, 10).forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'suggestion-item';
        itemDiv.dataset.index = index;
        const titleSpan = document.createElement('span');
        titleSpan.textContent = getDisplayValue(item);
        itemDiv.appendChild(titleSpan);

        if (getSubtitleValue) {
          const subtitleSpan = document.createElement('span');
          subtitleSpan.className = 'suggestion-subtitle';
          subtitleSpan.textContent = getSubtitleValue(item);
          itemDiv.appendChild(subtitleSpan);
        }
        itemDiv.addEventListener('click', () => selectItem(item));
        suggestionsContainer.appendChild(itemDiv);
      });
      suggestionsContainer.style.display = 'block';
    }
  });

  clearBtn.addEventListener('click', clearSelection);

  // Cerrar lista al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Navegación por teclado (Flechas y Enter)
  inputElement.addEventListener('keydown', (e) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    if (suggestionsContainer.style.display === 'none' || items.length === 0 || filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % filteredItems.length;
      highlightItems(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + filteredItems.length) % filteredItems.length;
      highlightItems(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        selectItem(filteredItems[highlightedIndex]);
      } else if (filteredItems.length > 0) {
        selectItem(filteredItems[0]);
      }
    } else if (e.key === 'Escape') {
      suggestionsContainer.style.display = 'none';
    }
  });

  function highlightItems(items) {
    items.forEach((item, index) => {
      if (index === highlightedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }
}

// Cargar asistencias del Backend y repintar UI
async function cargarAsistencias() {
  try {
    const res = await fetch('/api/asistencias');
    if (!res.ok) throw new Error('Error al conectar con la API de asistencias');
    asistenciasData = await res.json();
    
    renderTablaAsistencias();
    calcularEstadisticas();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Configuración de event listeners
function registrarEventListeners() {
  // Mostrar/Ocultar detalles de clase según "Dicto clases"
  const toggleClaseDetails = () => {
    if (dictoSiRadio.checked) {
      classDetailsContainer.style.display = 'block';
    } else {
      classDetailsContainer.style.display = 'none';
      limpiarCamposClase();
    }
  };
  dictoSiRadio.addEventListener('change', toggleClaseDetails);
  dictoNoRadio.addEventListener('change', toggleClaseDetails);

  // Mostrar/Ocultar minutos de atraso según "Inicio"
  inicioSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Con Retraso') {
      atrasoMinutesGroup.style.display = 'flex';
      minutosAtrasoInput.required = true;
      minutosAtrasoInput.focus();
    } else {
      atrasoMinutesGroup.style.display = 'none';
      minutosAtrasoInput.required = false;
      minutosAtrasoInput.value = '';
    }
  });

  // Mostrar/Ocultar minutos fin y cambiar label según "Final clase"
  finalClaseSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'Se extendió') {
      finalMinutesGroup.style.display = 'flex';
      minutosFinalInput.required = true;
      minutosFinalLabel.innerHTML = '<i data-lucide="timer"></i> Minutos de Extensión';
      minutosFinalInput.focus();
      lucide.createIcons();
    } else if (val === 'Se fue antes') {
      finalMinutesGroup.style.display = 'flex';
      minutosFinalInput.required = true;
      minutosFinalLabel.innerHTML = '<i data-lucide="timer"></i> Minutos Anticipados';
      minutosFinalInput.focus();
      lucide.createIcons();
    } else {
      finalMinutesGroup.style.display = 'none';
      minutosFinalInput.required = false;
      minutosFinalInput.value = '';
    }
  });

  // Envío de Formulario Principal
  form.addEventListener('submit', handleFormSubmit);

  // Cancelar Edición de Registro de Asistencia
  cancelAttendanceEditBtn.addEventListener('click', cancelarAsistenciaEdit);

  // Exportaciones
  exportCsvBtn.addEventListener('click', exportarCSV);
  exportJsonBtn.addEventListener('click', exportarJSON);

  // Desbloqueo secreto de Programa de Carrera (Triple Clic)
  programaInput.addEventListener('click', (e) => {
    if (e.detail === 3) {
      const password = prompt("Ingrese la contraseña de desbloqueo para editar el programa:");
      if (password === "2323") {
        programaInput.removeAttribute('readonly');
        programaInput.classList.remove('readonly-input');
        showToast('Campo "Programa" desbloqueado para edición manual.', 'success');
        programaInput.focus();
      } else if (password !== null) {
        showToast('Contraseña incorrecta.', 'error');
      }
    }
  });

  // Filtro de Fecha
  filterDateInput.addEventListener('input', renderTablaAsistencias);
  clearFilterBtn.addEventListener('click', () => {
    filterDateInput.value = '';
    renderTablaAsistencias();
  });

  // Filtro de Materia
  filterMateriaInput.addEventListener('input', renderTablaAsistencias);
  clearMateriaFilterBtn.addEventListener('click', () => {
    filterMateriaInput.value = '';
    renderTablaAsistencias();
  });
  // Filtros Rápidos por Tarjetas de Estadísticas
  function setupStatsFilter(boxElement, filterValue) {
    if (!boxElement) return;
    boxElement.addEventListener('click', () => {
      if (currentStatsFilter === filterValue) {
        currentStatsFilter = 'todos';
        boxElement.classList.remove('active-filter');
      } else {
        currentStatsFilter = filterValue;
        boxStatsElements.forEach(box => {
          if (box) box.classList.remove('active-filter');
        });
        boxElement.classList.add('active-filter');
      }
      renderTablaAsistencias();
    });
  }

  setupStatsFilter(boxTotal, 'todos');
  setupStatsFilter(boxDictadas, 'dictadas');
  setupStatsFilter(boxAtrasos, 'atrasos');
  setupStatsFilter(boxSinDictar, 'sin-dictar');
  setupStatsFilter(boxSinDictarHoy, 'sin-dictar-hoy');
  // Pantalla Completa Historial
  fullscreenBtn.addEventListener('click', () => {
    const isFullscreen = dataCard.classList.toggle('fullscreen-mode');
    if (isFullscreen) {
      fullscreenIcon.setAttribute('data-lucide', 'minimize-2');
      fullscreenBtn.setAttribute('title', 'Salir de pantalla completa');
    } else {
      fullscreenIcon.setAttribute('data-lucide', 'maximize-2');
      fullscreenBtn.setAttribute('title', 'Ampliar a pantalla completa');
    }
    lucide.createIcons();
  });

  // Conmutador de Tema (Theme Toggle)
  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    if (isLight) {
      localStorage.setItem('theme', 'light');
      themeToggleIcon.setAttribute('data-lucide', 'moon');
    } else {
      localStorage.setItem('theme', 'dark');
      themeToggleIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
  });

  // --- LÓGICA DEL MODAL DE ADMINISTRACIÓN ---

  // Abrir Modal
  openAdminBtn.addEventListener('click', () => {
    adminModal.style.display = 'flex';
    setDocenteInputMode('single');
    setMateriaInputMode('single');
    cancelarDocenteEdit();
    cancelarMateriaEdit();
    cancelarGestionEdit();
    renderAdminLists();
    lucide.createIcons();
  });

  // Cerrar Modal
  closeAdminBtn.addEventListener('click', () => {
    adminModal.style.display = 'none';
    cancelarDocenteEdit();
    cancelarMateriaEdit();
    cancelarGestionEdit();
  });

  // Cerrar Modal haciendo click fuera
  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = 'none';
      cancelarDocenteEdit();
      cancelarMateriaEdit();
      cancelarGestionEdit();
    }
  });

  // Navegación por pestañas del modal
  const tabBtns = adminModal.querySelectorAll('.tab-btn');
  const tabContents = adminModal.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');
      
      btn.classList.add('active');
      const targetContent = document.getElementById(btn.dataset.tab);
      if (targetContent) targetContent.style.display = 'block';
      
      setDocenteInputMode('single');
      setMateriaInputMode('single');
      cancelarDocenteEdit();
      cancelarMateriaEdit();
      cancelarGestionEdit();
      lucide.createIcons();
    });
  });

  // --- Alternancia de modos Carga (Individual / Masiva) ---
  
  // Docentes Modos
  docentesSingleModeBtn.addEventListener('click', () => setDocenteInputMode('single'));
  docentesBulkModeBtn.addEventListener('click', () => setDocenteInputMode('bulk'));
  
  // Materias Modos
  materiasSingleModeBtn.addEventListener('click', () => setMateriaInputMode('single'));
  materiasBulkModeBtn.addEventListener('click', () => setMateriaInputMode('bulk'));

  // Envío de Nuevo / Editado Docente (Individual)
  newDocenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = newDocenteNombre.value.trim();
    if (!nombre) return;

    try {
      let res, data;
      if (docenteEditId !== null) {
        res = await fetch(`/api/docentes/${docenteEditId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar docente');
        showToast('Docente actualizado con éxito', 'success');
      } else {
        res = await fetch('/api/docentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar docente');
        showToast('Docente agregado con éxito', 'success');
      }
      
      cancelarDocenteEdit();
      await cargarDatosMaestros();
      renderAdminLists();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Envío de Docentes Masivos
  bulkDocenteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawText = bulkDocentesLista.value.trim();
    if (!rawText) return;

    const nombres = rawText.split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (nombres.length === 0) {
      showToast('Por favor, ingresa al menos un nombre de docente válido.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/docentes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la carga masiva');

      showToast(data.mensaje || 'Docentes agregados con éxito', 'success');
      bulkDocentesLista.value = '';
      setDocenteInputMode('single');
      await cargarDatosMaestros();
      renderAdminLists();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Cancelar Edición Docente
  cancelDocenteEditBtn.addEventListener('click', cancelarDocenteEdit);

  // Envío de Nueva / Editada Materia (Soporta Individual y Carga Masiva)
  newMateriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const programa = newMateriaPrograma.value;
    const idioma_predeterminado = newMateriaIdioma.value;

    if (materiaBulkMode) {
      // --- MODO CARGA MASIVA ---
      const rawText = bulkMateriasLista.value.trim();
      if (!rawText) return;

      const lineas = rawText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (lineas.length === 0) {
        showToast('Ingresa al menos una materia válida.', 'error');
        return;
      }

      const materias = lineas.map(nombre => ({
        nombre,
        programa,
        idioma_predeterminado
      }));

      try {
        const res = await fetch('/api/materias/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materias })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en la carga masiva');

        showToast(data.mensaje || 'Materias agregadas con éxito', 'success');
        bulkMateriasLista.value = '';
        setMateriaInputMode('single');
        await cargarDatosMaestros();
        renderAdminLists();
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      // --- MODO INDIVIDUAL ---
      const nombre = newMateriaNombre.value.trim();
      if (!nombre) return;

      try {
        let res, data;
        if (materiaEditId !== null) {
          res = await fetch(`/api/materias/${materiaEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, programa, idioma_predeterminado })
          });
          data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al actualizar materia');
          showToast('Materia actualizada con éxito', 'success');
        } else {
          res = await fetch('/api/materias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, programa, idioma_predeterminado })
          });
          data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al guardar materia');
          showToast('Materia agregada con éxito', 'success');
        }

        cancelarMateriaEdit();
        await cargarDatosMaestros();
        renderAdminLists();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Cancelar Edición Materia
  cancelMateriaEditBtn.addEventListener('click', cancelarMateriaEdit);

  // Envío de Nueva Gestión Académica
  newGestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = newGestionNombre.value.trim();
    if (!nombre) return;

    try {
      let res, data;
      res = await fetch('/api/gestiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, activa: false })
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar gestión');
      showToast('Gestión académica creada con éxito', 'success');

      cancelarGestionEdit();
      await cargarDatosMaestros();
      renderAdminLists();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Cancelar Edición Gestión
  cancelGestionEditBtn.addEventListener('click', cancelarGestionEdit);
}

// Alternar entre modo de entrada de Docente (individual / masivo)
function setDocenteInputMode(mode) {
  if (mode === 'bulk') {
    docentesSingleModeBtn.classList.remove('active');
    docentesBulkModeBtn.classList.add('active');
    newDocenteForm.style.display = 'none';
    bulkDocenteForm.style.display = 'block';
    cancelarDocenteEdit();
    bulkDocentesLista.focus();
  } else {
    docentesSingleModeBtn.classList.add('active');
    docentesBulkModeBtn.classList.remove('active');
    newDocenteForm.style.display = 'block';
    bulkDocenteForm.style.display = 'none';
    bulkDocentesLista.value = '';
    newDocenteNombre.focus();
  }
}

// Alternar entre modo de entrada de Materia (individual / masivo)
function setMateriaInputMode(mode) {
  if (mode === 'bulk') {
    materiasSingleModeBtn.classList.remove('active');
    materiasBulkModeBtn.classList.add('active');
    materiaNombreGroup.style.display = 'none';
    newMateriaNombre.required = false;
    newMateriaNombre.value = '';
    
    materiaBulkGroup.style.display = 'block';
    bulkMateriasLista.required = true;
    materiaSubmitBtn.textContent = 'Cargar Lista de Materias';
    
    cancelarMateriaEdit();
    materiaBulkMode = true;
    bulkMateriasLista.focus();
  } else {
    materiasSingleModeBtn.classList.add('active');
    materiasBulkModeBtn.classList.remove('active');
    materiaNombreGroup.style.display = 'block';
    newMateriaNombre.required = true;
    
    materiaBulkGroup.style.display = 'none';
    bulkMateriasLista.required = false;
    bulkMateriasLista.value = '';
    materiaSubmitBtn.textContent = 'Agregar Materia';
    
    materiaBulkMode = false;
    newMateriaNombre.focus();
  }
}

// Limpiar valores condicionales al desactivar "Dicto clases"
function limpiarCamposClase() {
  claseSelect.value = 'Presencial';
  idiomaDictadoSelect.value = 'Español';
  reposicionSelect.value = 'NO';
  inicioSelect.value = 'Puntual';
  atrasoMinutesGroup.style.display = 'none';
  minutosAtrasoInput.value = '';
  minutosAtrasoInput.required = false;
  
  finalClaseSelect.value = 'Puntual';
  finalMinutesGroup.style.display = 'none';
  minutosFinalInput.value = '';
  minutosFinalInput.required = false;
}

// --- LÓGICA DE EDICIÓN EN EL MODAL ---

// Cargar Docente para Editar
function editarDocente(id) {
  setDocenteInputMode('single');
  const docente = maestrosData.docentes.find(d => d.id === id);
  if (!docente) return;
  newDocenteNombre.value = docente.nombre;
  docenteEditId = id;
  docenteSubmitBtn.textContent = 'Guardar';
  cancelDocenteEditBtn.style.display = 'block';
  newDocenteNombre.focus();
}

// Cancelar Edición Docente
function cancelarDocenteEdit() {
  newDocenteNombre.value = '';
  docenteEditId = null;
  docenteSubmitBtn.textContent = 'Agregar';
  cancelDocenteEditBtn.style.display = 'none';
}

// Cargar Materia para Editar
function editarMateria(id) {
  setMateriaInputMode('single');
  const materia = maestrosData.materias.find(m => m.id === id);
  if (!materia) return;
  newMateriaNombre.value = materia.nombre;
  newMateriaPrograma.value = materia.programa;
  newMateriaIdioma.value = materia.idioma_predeterminado;
  materiaEditId = id;
  materiaSubmitBtn.textContent = 'Guardar Cambios';
  cancelMateriaEditBtn.style.display = 'block';
  newMateriaNombre.focus();
}

// Cancelar Edición Materia
function cancelarMateriaEdit() {
  newMateriaNombre.value = '';
  newMateriaPrograma.value = 'LpD';
  newMateriaIdioma.value = 'Español';
  materiaEditId = null;
  materiaSubmitBtn.textContent = 'Agregar Materia';
  cancelMateriaEditBtn.style.display = 'none';
}

// Cancelar Edición Gestión
function cancelarGestionEdit() {
  newGestionNombre.value = '';
  gestionEditId = null;
  gestionSubmitBtn.textContent = 'Agregar';
  cancelGestionEditBtn.style.display = 'none';
}

// Activar una Gestión Académica
async function activarGestion(id) {
  try {
    const res = await fetch(`/api/gestiones/${id}/activar`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al activar gestión');

    showToast('Gestión académica activada', 'success');
    await cargarDatosMaestros();
    renderAdminLists();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Eliminar una Gestión Académica
async function eliminarGestion(id) {
  if (!confirm('¿Desea eliminar esta gestión académica? Las asistencias ya registradas conservarán su nombre de gestión, pero no podrás volver a seleccionarla.')) return;

  try {
    const res = await fetch(`/api/gestiones/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar la gestión');

    showToast('Gestión académica eliminada con éxito', 'success');
    await cargarDatosMaestros();
    renderAdminLists();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Pintar las listas de docentes, materias y gestiones del modal de administración
function renderAdminLists() {
  // 1. Lista de Docentes
  adminDocentesList.innerHTML = '';
  if (maestrosData.docentes.length === 0) {
    adminDocentesList.innerHTML = `<li class="admin-item" style="color:var(--text-muted); font-style:italic;">No hay docentes registrados.</li>`;
  } else {
    maestrosData.docentes.forEach(d => {
      const li = document.createElement('li');
      li.className = 'admin-item';
      li.innerHTML = `
        <span>${d.nombre}</span>
        <div style="display: flex; gap: 8px;">
          <button class="delete-btn" onclick="editarDocente(${d.id})" title="Editar docente" style="color: var(--primary-color); background: rgba(59, 130, 246, 0.1);">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="delete-btn" onclick="eliminarDocente(${d.id})" title="Eliminar docente">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      adminDocentesList.appendChild(li);
    });
  }

  // 2. Lista de Materias
  adminMateriasList.innerHTML = '';
  if (maestrosData.materias.length === 0) {
    adminMateriasList.innerHTML = `<li class="admin-item" style="color:var(--text-muted); font-style:italic;">No hay materias registradas.</li>`;
  } else {
    maestrosData.materias.forEach(m => {
      const li = document.createElement('li');
      li.className = 'admin-item';
      li.innerHTML = `
        <div class="admin-item-text">
          <span>${m.nombre}</span>
          <span class="admin-item-subtitle">Programa: ${m.programa} | Idioma: ${m.idioma_predeterminado}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="delete-btn" onclick="editarMateria(${m.id})" title="Editar materia" style="color: var(--primary-color); background: rgba(59, 130, 246, 0.1);">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="delete-btn" onclick="eliminarMateria(${m.id})" title="Eliminar materia">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      adminMateriasList.appendChild(li);
    });
  }

  // 3. Lista de Gestiones Académicas
  adminGestionesList.innerHTML = '';
  if (!maestrosData.gestiones || maestrosData.gestiones.length === 0) {
    adminGestionesList.innerHTML = `<li class="admin-item" style="color:var(--text-muted); font-style:italic;">No hay gestiones académicas registradas.</li>`;
  } else {
    maestrosData.gestiones.forEach(g => {
      const li = document.createElement('li');
      li.className = 'admin-item';
      
      const badge = g.activa === 1
        ? `<span class="badge yes" style="font-size: 10px; padding: 2px 8px; font-weight:500; text-transform:none;"><i data-lucide="check"></i> Activa</span>`
        : '';

      const actButton = g.activa === 0
        ? `<button class="delete-btn" onclick="activarGestion(${g.id})" title="Establecer como gestión activa" style="color: var(--accent-green); background: rgba(16, 185, 129, 0.1); margin-right: 4px;">
            <i data-lucide="check-circle"></i> Activar
           </button>`
        : '';

      li.innerHTML = `
        <div class="admin-item-text" style="flex-direction:row; align-items:center; gap:10px;">
          <strong>${g.nombre}</strong>
          ${badge}
        </div>
        <div style="display: flex; gap: 8px;">
          ${actButton}
          <button class="delete-btn" onclick="eliminarGestion(${g.id})" title="Eliminar gestión">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      adminGestionesList.appendChild(li);
    });
  }
  
  lucide.createIcons();
}

// Eliminar Docente del maestro
async function eliminarDocente(id) {
  if (!confirm('¿Desea eliminar este docente de los datos maestros? No afectará a los registros de asistencia ya cargados.')) return;

  try {
    const res = await fetch(`/api/docentes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar docente');

    showToast('Docente eliminado con éxito', 'success');
    if (docenteEditId === id) cancelarDocenteEdit();
    await cargarDatosMaestros();
    renderAdminLists();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Eliminar Materia del maestro
async function eliminarMateria(id) {
  if (!confirm('¿Desea eliminar esta materia de los datos maestros? No afectará a los registros de asistencia ya cargados.')) return;

  try {
    const res = await fetch(`/api/materias/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar materia');

    showToast('Materia eliminada con éxito', 'success');
    if (materiaEditId === id) cancelarMateriaEdit();
    await cargarDatosMaestros();
    renderAdminLists();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- LÓGICA DE EDICIÓN EN LA TABLA PRINCIPAL ---

// Cargar un Registro de Asistencia para Editar
function editarAsistencia(id) {
  const item = asistenciasData.find(a => a.id === id);
  if (!item) return;

  // Cargar campos básicos
  fechaInput.value = item.fecha;
  gestionSelect.value = item.gestion_id || "";

  docenteBuscarInput.value = item.docente_nombre;
  docenteIdInput.value = item.docente_id;
  clearDocenteBtn.style.display = 'flex';

  materiaBuscarInput.value = item.materia_nombre;
  materiaIdInput.value = item.materia_id;
  clearMateriaBtn.style.display = 'flex';

  programaInput.value = item.programa;

  // Dicto clases
  if (item.dicto_clases === 'SI') {
    dictoSiRadio.checked = true;
    classDetailsContainer.style.display = 'block';
    
    // Cargar detalles de la clase
    claseSelect.value = item.clase;
    reposicionSelect.value = item.reposicion || 'NO';
    idiomaDictadoSelect.value = item.idioma_dictado;
    
    // Inicio
    inicioSelect.value = item.inicio;
    if (item.inicio === 'Con Retraso') {
      atrasoMinutesGroup.style.display = 'flex';
      minutosAtrasoInput.value = item.minutos_atraso;
      minutosAtrasoInput.required = true;
    } else {
      atrasoMinutesGroup.style.display = 'none';
      minutosAtrasoInput.value = '';
      minutosAtrasoInput.required = false;
    }

    // Final
    finalClaseSelect.value = item.final_clase;
    if (item.final_clase === 'Se extendió') {
      finalMinutesGroup.style.display = 'flex';
      minutosFinalInput.value = item.minutos_final;
      minutosFinalInput.required = true;
      minutosFinalLabel.innerHTML = '<i data-lucide="timer"></i> Minutos de Extensión';
    } else if (item.final_clase === 'Se fue antes') {
      finalMinutesGroup.style.display = 'flex';
      minutosFinalInput.value = item.minutos_final;
      minutosFinalInput.required = true;
      minutosFinalLabel.innerHTML = '<i data-lucide="timer"></i> Minutos Anticipados';
    } else {
      finalMinutesGroup.style.display = 'none';
      minutosFinalInput.value = '';
      minutosFinalInput.required = false;
    }
  } else {
    dictoNoRadio.checked = true;
    classDetailsContainer.style.display = 'none';
    limpiarCamposClase();
  }

  comentariosTextarea.value = item.comentarios || '';

  // Activar Modo Edición
  asistenciaEditId = id;
  submitBtn.querySelector('.btn-text').textContent = 'Guardar Cambios';
  submitBtn.style.background = 'linear-gradient(135deg, var(--secondary-color) 0%, #4338ca 100%)';
  cancelAttendanceEditBtn.style.display = 'flex';

  // Desplazar al formulario
  window.scrollTo({
    top: form.getBoundingClientRect().top + window.scrollY - 100,
    behavior: 'smooth'
  });
  
  lucide.createIcons();
}

// Cancelar Edición de Asistencia
function cancelarAsistenciaEdit() {
  form.reset();
  
  // Reestablecer fecha de hoy
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  let mm = hoy.getMonth() + 1;
  let dd = hoy.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  fechaInput.value = `${yyyy}-${mm}-${dd}`;

  // Limpiar autocompletados
  docenteIdInput.value = '';
  docenteBuscarInput.value = '';
  clearDocenteBtn.style.display = 'none';
  
  materiaIdInput.value = '';
  materiaBuscarInput.value = '';
  clearMateriaBtn.style.display = 'none';

  programaInput.value = '';
  dictoSiRadio.checked = true;
  classDetailsContainer.style.display = 'block';
  limpiarCamposClase();

  // Re-seleccionar gestión activa
  rellenarSelectGestiones();

  // Resetear variables y botones
  asistenciaEditId = null;
  submitBtn.querySelector('.btn-text').textContent = 'Registrar Asistencia';
  submitBtn.style.background = '';
  cancelAttendanceEditBtn.style.display = 'none';
  
  // Asegurar que el programa de la carrera vuelva a bloquearse
  programaInput.setAttribute('readonly', true);
  programaInput.classList.add('readonly-input');

  lucide.createIcons();
}

// Procesar submit del formulario principal (Soporta POST y PUT)
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validaciones del Autocompletado
  let validez = true;
  if (!docenteIdInput.value) {
    docenteBuscarInput.setCustomValidity('Debe buscar y seleccionar un docente de la lista.');
    validez = false;
  } else {
    docenteBuscarInput.setCustomValidity('');
  }

  if (!materiaIdInput.value) {
    materiaBuscarInput.setCustomValidity('Debe buscar y seleccionar una materia de la lista.');
    validez = false;
  } else {
    materiaBuscarInput.setCustomValidity('');
  }
  
  // Validaciones HTML5 generales
  if (!form.checkValidity() || !validez) {
    showToast('Por favor, complete todos los campos y seleccione un docente y materia válidos.', 'error');
    form.reportValidity();
    return;
  }

  // Preparar datos
  const docenteId = parseInt(docenteIdInput.value);
  const docente = maestrosData.docentes.find(d => d.id === docenteId);
  
  const materiaId = parseInt(materiaIdInput.value);
  const materia = maestrosData.materias.find(m => m.id === materiaId);

  const gestionId = parseInt(gestionSelect.value);
  const gestion = maestrosData.gestiones.find(g => g.id === gestionId);

  const dictoClases = dictoSiRadio.checked ? 'SI' : 'NO';

  // Validar duplicados localmente y mostrar advertencia interactiva (confirm)
  const yaExiste = asistenciasData.some(a => 
    a.fecha === fechaInput.value && 
    a.docente_id === docenteId && 
    a.materia_id === materiaId &&
    a.id !== asistenciaEditId
  );

  if (yaExiste) {
    const confirmar = confirm("Esta materia ya fue registrada hoy para este profesor. ¿Deseas añadir un nuevo registro de todas formas?");
    if (!confirmar) {
      return;
    }
  }

  const bodyData = {
    fecha: fechaInput.value,
    docente_id: docenteId,
    docente_nombre: docente ? docente.nombre : '',
    materia_id: materiaId,
    materia_nombre: materia ? materia.nombre : '',
    programa: programaInput.value,
    gestion_id: gestionId,
    gestion_nombre: gestion ? gestion.nombre : '',
    dicto_clases: dictoClases,
    clase: claseSelect.value,
    reposicion: reposicionSelect.value,
    inicio: inicioSelect.value,
    minutos_atraso: minutosAtrasoInput.value || 0,
    final_clase: finalClaseSelect.value,
    minutos_final: minutosFinalInput.value || 0,
    idioma_dictado: idiomaDictadoSelect.value,
    comentarios: comentariosTextarea.value.trim()
  };

  // Mostrar loading
  submitBtn.disabled = true;
  btnSpinner.style.display = 'block';
  submitBtn.querySelector('.btn-text').textContent = 'Guardando...';

  try {
    let res, data;
    if (asistenciaEditId !== null) {
      // Modo Edición (PUT)
      res = await fetch(`/api/asistencias/${asistenciaEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar registro');
      showToast('Registro de asistencia actualizado correctamente', 'success');
    } else {
      // Modo Creación (POST)
      res = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar registro');
      showToast('Asistencia registrada correctamente', 'success');
    }
    
    // Limpiar variables de edición y restaurar formulario
    cancelarAsistenciaEdit();

    // Recargar tabla e historial
    await cargarAsistencias();

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    btnSpinner.style.display = 'none';
  }
}

// Eliminar un registro de asistencia
async function deleteAsistencia(id) {
  if (!confirm('¿Está seguro de que desea eliminar este registro de asistencia?')) return;

  try {
    const res = await fetch(`/api/asistencias/${id}`, {
      method: 'DELETE'
    });

    const resJson = await res.json();
    if (!res.ok) throw new Error(resJson.error || 'Error al eliminar');

    showToast('Registro eliminado con éxito', 'success');
    if (asistenciaEditId === id) cancelarAsistenciaEdit();
    await cargarAsistencias();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Pintar tabla en el frontend (con badge de Gestión Académica)
function renderTablaAsistencias() {
  const filterDate = filterDateInput.value;
  const rawFilterMateria = filterMateriaInput.value.trim();
  const filterMateria = normalizeText(rawFilterMateria);

  // Control de botones de limpieza
  clearFilterBtn.style.display = filterDate ? 'flex' : 'none';
  clearMateriaFilterBtn.style.display = rawFilterMateria ? 'flex' : 'none';

  // Obtener fecha de hoy local en formato YYYY-MM-DD
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  let mm = hoy.getMonth() + 1;
  let dd = hoy.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

  // Filtrado acumulativo (Fecha AND Materia AND Estadísticas)
  const dataFiltrada = asistenciasData.filter(a => {
    const cumpleFecha = !filterDate || a.fecha === filterDate;
    const cumpleMateria = !filterMateria || normalizeText(a.materia_nombre).includes(filterMateria);
    
    let cumpleStats = true;
    if (currentStatsFilter === 'dictadas') {
      cumpleStats = a.dicto_clases === 'SI';
    } else if (currentStatsFilter === 'atrasos') {
      cumpleStats = a.inicio === 'Con Retraso';
    } else if (currentStatsFilter === 'sin-dictar') {
      cumpleStats = a.dicto_clases === 'NO';
    } else if (currentStatsFilter === 'sin-dictar-hoy') {
      cumpleStats = (a.fecha === fechaHoyStr && a.dicto_clases === 'NO');
    }
    
    return cumpleFecha && cumpleMateria && cumpleStats;
  });

  if (dataFiltrada.length === 0) {
    let msg = 'No hay registros de asistencia guardados.';
    if (filterDate || rawFilterMateria || currentStatsFilter !== 'todos') {
      const filtrosActivos = [];
      if (filterDate) filtrosActivos.push('la fecha seleccionada');
      if (rawFilterMateria) filtrosActivos.push('la materia buscada');
      if (currentStatsFilter === 'dictadas') filtrosActivos.push('clases dictadas');
      if (currentStatsFilter === 'atrasos') filtrosActivos.push('atrasos');
      if (currentStatsFilter === 'sin-dictar') filtrosActivos.push('clases sin dictar');
      if (currentStatsFilter === 'sin-dictar-hoy') filtrosActivos.push('clases sin dictar hoy');
      msg = `No se encontraron registros que cumplan con: ${filtrosActivos.join(', ')}.`;
    }
    attendanceTbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="10">${msg}</td>
      </tr>
    `;
    return;
  }

  attendanceTbody.innerHTML = '';
  dataFiltrada.forEach(item => {
    const tr = document.createElement('tr');
    
    const fechaPartes = item.fecha.split('-');
    const fechaFormateada = `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]}`;

    const dictoBadge = item.dicto_clases === 'SI' 
      ? `<span class="badge yes"><i data-lucide="check"></i> SÍ</span>` 
      : `<span class="badge no"><i data-lucide="x"></i> NO</span>`;

    let modCell = 'N/A';
    if (item.dicto_clases === 'SI') {
      if (item.clase === 'Presencial') {
        modCell = `<span class="badge presencial"><i data-lucide="user"></i> Presencial</span>`;
      } else if (item.clase === 'Virtual') {
        modCell = `<span class="badge virtual"><i data-lucide="laptop"></i> Virtual</span>`;
      } else if (item.clase === 'CLASES SIN DICTAR') {
        modCell = `<span class="badge no" style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.2); font-size:10px;"><i data-lucide="calendar-off"></i> Sin Dictar</span>`;
      } else if (item.clase === 'SIN DICTAR HOY') {
        modCell = `<span class="badge no" style="font-size:10px;"><i data-lucide="x-circle"></i> Sin Dictar Hoy</span>`;
      } else {
        modCell = `<span class="badge no">${item.clase}</span>`;
      }
    }

    let horariosCell = 'N/A';
    if (item.dicto_clases === 'SI') {
      let inicioBadge = `<span class="badge puntual">Inicio: Puntual</span>`;
      if (item.inicio === 'Con Retraso') {
        inicioBadge = `<span class="badge atraso">Atraso: +${item.minutos_atraso}m</span>`;
      }

      let finBadge = `<span class="badge puntual">Fin: Puntual</span>`;
      if (item.final_clase === 'Se extendió') {
        finBadge = `<span class="badge extension">Ext: +${item.minutos_final}m</span>`;
      } else if (item.final_clase === 'Se fue antes') {
        finBadge = `<span class="badge temprano">Antes: -${item.minutos_final}m</span>`;
      }

      horariosCell = `<div style="display:flex; flex-direction:column; gap:4px;">${inicioBadge}${finBadge}</div>`;
    }

    let idiomaCell = 'N/A';
    if (item.dicto_clases === 'SI') {
      const esDesvio = (item.materia_idioma_predeterminado === 'Inglés' && item.idioma_dictado === 'Español');
      if (esDesvio) {
        idiomaCell = `<span class="badge no" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); font-weight: bold; gap: 4px; padding: 4px 8px; font-size: 10px;" title="Desvío: Materia de Inglés dictada en Español"><i data-lucide="alert-triangle" style="width: 11px; height: 11px;"></i> ES</span>`;
      } else {
        idiomaCell = item.idioma_dictado === 'Español'
          ? `<span class="badge esp">ES</span>`
          : `<span class="badge eng">EN</span>`;
      }
    }

    tr.innerHTML = `
      <td><strong>${fechaFormateada}</strong></td>
      <td>${item.docente_nombre}</td>
      <td>${item.materia_nombre}${item.reposicion === 'SI' ? ' <span class="badge puntual" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding:2px 6px; font-size:9px; border: 1px solid rgba(245, 158, 11, 0.2); gap: 2px;" title="Clase de Reposición"><i data-lucide="refresh-cw" style="width:8px; height:8px;"></i> REP</span>' : ''}</td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
          <span class="badge esp">${item.programa}</span>
          <span style="font-size: 10px; color: var(--text-muted); font-weight: 500; white-space: nowrap;">${item.gestion_nombre}</span>
        </div>
      </td>
      <td>${dictoBadge}</td>
      <td>${modCell}</td>
      <td>${horariosCell}</td>
      <td>${idiomaCell}</td>
      <td><div class="cell-comments" title="${item.comentarios || ''}">${item.comentarios || '<span style="color:var(--text-muted)">-</span>'}</div></td>
      <td class="actions-col">
        <div style="display: flex; gap: 6px; justify-content: center;">
          <button class="delete-btn" onclick="editarAsistencia(${item.id})" title="Editar registro" style="color: var(--primary-color); background: rgba(59, 130, 246, 0.1);">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="delete-btn" onclick="deleteAsistencia(${item.id})" title="Eliminar registro">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    
    attendanceTbody.appendChild(tr);
  });

  lucide.createIcons();
}

// Calcular panel de estadísticas
function calcularEstadisticas() {
  const total = asistenciasData.length;
  const dictadas = asistenciasData.filter(a => a.dicto_clases === 'SI').length;
  const sinDictar = asistenciasData.filter(a => a.dicto_clases === 'NO').length;
  
  const atraso = asistenciasData.reduce((acc, a) => {
    return acc + (a.minutos_atraso || 0);
  }, 0);

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  let mm = hoy.getMonth() + 1;
  let dd = hoy.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

  const sinDictarHoy = asistenciasData.filter(a => a.fecha === fechaHoyStr && a.dicto_clases === 'NO').length;

  statTotal.textContent = total;
  statDictadas.textContent = dictadas;
  statAtraso.textContent = `${atraso} min`;
  statSinDictar.textContent = sinDictar;
  statSinDictarHoy.textContent = sinDictarHoy;
}

// Mostrar Toasts elegantes
function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-octagon';
  toastIcon.setAttribute('data-lucide', iconName);
  
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Exportación a CSV
function exportarCSV() {
  if (asistenciasData.length === 0) {
    showToast('No hay datos disponibles para exportar', 'info');
    return;
  }

  const headers = [
    'ID', 'Fecha', 'Gestión Académica', 'ID Docente', 'Docente', 'ID Materia', 'Materia', 
    'Programa', 'Dictó Clases', 'Modalidad', 'Es Reposición', 'Inicio', 'Minutos Atraso', 
    'Fin Clase', 'Minutos Variación Fin', 'Idioma Dictado', 'Comentarios'
  ];

  const rows = asistenciasData.map(item => [
    item.id,
    item.fecha,
    `"${item.gestion_nombre}"`,
    item.docente_id,
    `"${item.docente_nombre.replace(/"/g, '""')}"`,
    item.materia_id,
    `"${item.materia_nombre.replace(/"/g, '""')}"`,
    item.programa,
    item.dicto_clases,
    item.clase,
    item.reposicion || 'NO',
    item.inicio,
    item.minutos_atraso,
    item.final_clase,
    item.minutos_final,
    item.idioma_dictado,
    `"${(item.comentarios || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  descargarArchivo(csvContent, 'text/csv;charset=utf-8;', 'asistencia_docentes.csv');
}

// Exportación a JSON
function exportarJSON() {
  if (asistenciasData.length === 0) {
    showToast('No hay datos disponibles para exportar', 'info');
    return;
  }

  const jsonString = JSON.stringify(asistenciasData, null, 2);
  descargarArchivo(jsonString, 'application/json;charset=utf-8;', 'asistencia_docentes.json');
}

// Descargar archivo en el navegador
function descargarArchivo(contenido, mimeType, nombreArchivo) {
  const blob = new Blob([contenido], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Archivo ${nombreArchivo} descargado`, 'success');
}
