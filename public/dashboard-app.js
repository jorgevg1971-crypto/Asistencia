// --- ePC Asistencia - Lógica del Dashboard Público ---

// Variables de Datos Globales
let maestrosData = { docentes: [], materias: [], gestiones: [] };
let asistenciasData = [];

// Elementos DOM
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const currentDateText = document.getElementById('current-date-text');
const dashboardPdfBtn = document.getElementById('dashboard-pdf-btn');

// Filtros
const dbFilterDesde = document.getElementById('db_filter_desde');
const dbFilterHasta = document.getElementById('db_filter_hasta');
const dbFilterPrograma = document.getElementById('db_filter_programa');
const dbFilterProfesor = document.getElementById('db_filter_profesor');
const dbFilterMateria = document.getElementById('db_filter_materia');
const dbFilterSearch = document.getElementById('db_filter_search');
const dbResetFiltersBtn = document.getElementById('db-reset-filters-btn');

// Tarjetas Métricas
const dbCardTotal = document.getElementById('db-card-total');
const dbCardAtrasos = document.getElementById('db-card-atrasos');
const dbCardSalidas = document.getElementById('db-card-salidas');
const dbCardPerdidas = document.getElementById('db-card-perdidas');
const dbCardRepuestas = document.getElementById('db-card-repuestas');
const dbCardVirtuales = document.getElementById('db-card-virtuales');

const dbValTotal = document.getElementById('db-val-total');
const dbValAtrasos = document.getElementById('db-val-atrasos');
const dbValSalidas = document.getElementById('db-val-salidas');
const dbValPerdidas = document.getElementById('db-val-perdidas');
const dbValRepuestas = document.getElementById('db-val-repuestas');
const dbValVirtuales = document.getElementById('db-val-virtuales');
const dbValIdiomaIng = document.getElementById('db-val-idioma-ing');

// Instancias de gráficos activos
let chartsInstances = {};
let dbMetricFilter = null; // 'atrasos', 'salidas', 'perdidas', 'repuestas', 'virtuales' o null

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar fecha actual
  actualizarFechaActual();
  
  // Cargar Tema Guardado
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
    themeToggleIcon.setAttribute('data-lucide', 'sun');
  } else {
    // Por defecto (primera visita) o explícitamente claro
    document.body.classList.add('light-theme');
    themeToggleIcon.setAttribute('data-lucide', 'moon');
  }

  // Cargar Datos Iniciales del Backend
  try {
    await cargarDatosMaestros();
    await cargarAsistencias();
    
    // Rellenar selectores de la barra de filtros
    rellenarSelectoresDashboard();
    
    // Forzar programa TUSGE si se accede por el enlace /dashboard-tusge
    if (window.location.pathname.includes('/dashboard-tusge')) {
      dbFilterPrograma.value = 'TUSGE';
      dbFilterPrograma.disabled = true;
    }
    
    // Registrar Event Listeners
    registrarEventListeners();
    
    // Actualizar visualización del Dashboard
    actualizarDashboard();
  } catch (error) {
    showToast('Error al inicializar el dashboard: ' + error.message, 'error');
  }

  lucide.createIcons();
});

// Actualizar el texto de la fecha en la cabecera
function actualizarFechaActual() {
  if (currentDateText) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateText.textContent = new Date().toLocaleDateString('es-ES', opciones);
  }
}

// Cargar catálogos dinámicos
async function cargarDatosMaestros() {
  const res = await fetch('/api/maestros');
  if (!res.ok) throw new Error('No se pudieron obtener los datos maestros');
  maestrosData = await res.json();
}

// Cargar registros de asistencia
async function cargarAsistencias() {
  const res = await fetch('/api/asistencias');
  if (!res.ok) throw new Error('No se pudieron obtener las asistencias');
  asistenciasData = await res.json();
}

// Rellenar dinámicamente los selectores de filtros del Dashboard
function rellenarSelectoresDashboard() {
  if (!dbFilterProfesor || !dbFilterMateria) return;

  // Rango de fechas por defecto (Mes actual)
  const d = new Date();
  const primerDiaMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const hoyString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  dbFilterDesde.value = primerDiaMes;
  dbFilterHasta.value = hoyString;

  // Combo Profesores
  dbFilterProfesor.innerHTML = '<option value="TODOS">Todos los Profes</option>';
  const docentesOrdenados = [...maestrosData.docentes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  docentesOrdenados.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = doc.nombre;
    dbFilterProfesor.appendChild(opt);
  });

  // Combo Materias
  dbFilterMateria.innerHTML = '<option value="TODOS">Todas las Materias</option>';
  const materiasOrdenadas = [...maestrosData.materias].sort((a, b) => a.nombre.localeCompare(b.nombre));
  materiasOrdenadas.forEach(mat => {
    const opt = document.createElement('option');
    opt.value = mat.id;
    opt.textContent = mat.nombre;
    dbFilterMateria.appendChild(opt);
  });
}

// Registrar eventos
function registrarEventListeners() {
  // Conmutador de Tema
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
    actualizarDashboard();
  });

  // Filtros reactivos
  [dbFilterDesde, dbFilterHasta, dbFilterPrograma, dbFilterProfesor, dbFilterMateria].forEach(el => {
    if (el) el.addEventListener('change', () => actualizarDashboard());
  });

  if (dbFilterSearch) {
    dbFilterSearch.addEventListener('input', () => actualizarDashboard());
  }

  // Reiniciar filtros
  if (dbResetFiltersBtn) {
    dbResetFiltersBtn.addEventListener('click', () => {
      dbFilterDesde.value = '';
      dbFilterHasta.value = '';
      dbFilterPrograma.value = window.location.pathname.includes('/dashboard-tusge') ? 'TUSGE' : 'TODOS';
      dbFilterProfesor.value = 'TODOS';
      dbFilterMateria.value = 'TODOS';
      dbFilterSearch.value = '';
      dbMetricFilter = null;
      
      metricCards.forEach(c => {
        if (c.card) c.card.classList.remove('active');
      });

      actualizarDashboard();
      showToast('Filtros del dashboard reiniciados', 'info');
    });
  }

  // Exportar a PDF
  if (dashboardPdfBtn) {
    dashboardPdfBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Filtros rápidos por tarjetas métricas
  const metricCards = [
    { card: dbCardTotal, filterVal: null },
    { card: dbCardAtrasos, filterVal: 'atrasos' },
    { card: dbCardSalidas, filterVal: 'salidas' },
    { card: dbCardPerdidas, filterVal: 'perdidas' },
    { card: dbCardRepuestas, filterVal: 'repuestas' },
    { card: dbCardVirtuales, filterVal: 'virtuales' }
  ];

  metricCards.forEach(({ card, filterVal }) => {
    if (card) {
      card.addEventListener('click', () => {
        if (dbMetricFilter === filterVal) {
          dbMetricFilter = null;
        } else {
          dbMetricFilter = filterVal;
        }

        metricCards.forEach(c => {
          if (c.card) {
            if (dbMetricFilter === c.filterVal) {
              c.card.classList.add('active');
            } else {
              c.card.classList.remove('active');
            }
          }
        });

        actualizarDashboard();
        
        if (dbMetricFilter) {
          showToast(`Dashboard filtrado por: ${card.querySelector('.db-metric-subtitle').textContent}`, 'info');
        } else {
          showToast('Dashboard: Filtro de tarjeta removido', 'info');
        }
      });
    }
  });
}

// Normalización de texto para búsqueda difusa
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Función principal para filtrar datos y actualizar el Dashboard
function actualizarDashboard() {
  const desde = dbFilterDesde.value;
  const hasta = dbFilterHasta.value;
  const programa = dbFilterPrograma.value;
  const profesorId = dbFilterProfesor.value;
  const materiaId = dbFilterMateria.value;
  const searchVal = normalizeText(dbFilterSearch.value.trim());

  // Filtrar datos base de asistencias
  const dataFiltrada = asistenciasData.filter(a => {
    if (desde && a.fecha < desde) return false;
    if (hasta && a.fecha > hasta) return false;
    if (programa !== 'TODOS' && a.programa !== programa) return false;
    if (profesorId !== 'TODOS' && String(a.docente_id) !== profesorId) return false;
    if (materiaId !== 'TODOS' && String(a.materia_id) !== materiaId) return false;
    if (searchVal) {
      const matchText = `${a.docente_nombre} ${a.materia_nombre} ${a.programa} ${a.comentarios || ''}`;
      if (!normalizeText(matchText).includes(searchVal)) return false;
    }
    return true;
  });

  // Calcular métricas superiores base
  const total = dataFiltrada.length;
  const atrasos = dataFiltrada.filter(a => a.dicto_clases === 'SI' && a.inicio === 'Con Retraso').length;
  const salidas = dataFiltrada.filter(a => a.dicto_clases === 'SI' && a.final_clase === 'Se fue antes').length;
  const perdidas = dataFiltrada.filter(a => a.dicto_clases === 'NO').length;
  const repuestas = dataFiltrada.filter(a => a.reposicion === 'SI').length;
  const virtuales = dataFiltrada.filter(a => a.dicto_clases === 'SI' && String(a.clase || '').toUpperCase().trim() === 'VIRTUAL').length;

  dbValTotal.textContent = total;
  dbValAtrasos.textContent = atrasos;
  dbValSalidas.textContent = salidas;
  dbValPerdidas.textContent = perdidas;
  dbValRepuestas.textContent = repuestas;
  dbValVirtuales.textContent = virtuales;

  // Filtrar según tarjeta activa
  let dataFinal = dataFiltrada;
  if (dbMetricFilter) {
    if (dbMetricFilter === 'atrasos') {
      dataFinal = dataFiltrada.filter(a => a.dicto_clases === 'SI' && a.inicio === 'Con Retraso');
    } else if (dbMetricFilter === 'salidas') {
      dataFinal = dataFiltrada.filter(a => a.dicto_clases === 'SI' && a.final_clase === 'Se fue antes');
    } else if (dbMetricFilter === 'perdidas') {
      dataFinal = dataFiltrada.filter(a => a.dicto_clases === 'NO');
    } else if (dbMetricFilter === 'repuestas') {
      dataFinal = dataFiltrada.filter(a => a.reposicion === 'SI');
    } else if (dbMetricFilter === 'virtuales') {
      dataFinal = dataFiltrada.filter(a => a.dicto_clases === 'SI' && String(a.clase || '').toUpperCase().trim() === 'VIRTUAL');
    }
  }

  // Redibujar gráficos y recargar tablas
  renderizarGraficosDashboard(dataFinal);
  renderizarTablasIncidencias(dataFinal);
}

// Destruir instancias previas de gráficos para evitar colisiones
function destroyChart(id) {
  if (chartsInstances[id]) {
    chartsInstances[id].destroy();
    delete chartsInstances[id];
  }
}

// Renderizar gráficos de Chart.js con colores según el tema
function renderizarGraficosDashboard(data) {
  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#1f2937' : '#e5e7eb';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  const chartOptionsDefault = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, activeElements, chart) => {
      if (activeElements && activeElements.length > 0) {
        const activeElement = activeElements[0];
        const index = activeElement.index;
        const label = chart.data.labels[index];
        handleChartElementClick(chart.canvas.id, label);
      }
    },
    plugins: {
      legend: { labels: { color: textColor } }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { grid: { color: gridColor }, ticks: { color: textColor } }
    }
  };

  // 1. TOP 5 SALIDAS ANTES
  const salidasPorDocente = {};
  data.forEach(a => {
    if (a.final_clase === 'Se fue antes' && a.minutos_final) {
      salidasPorDocente[a.docente_nombre] = (salidasPorDocente[a.docente_nombre] || 0) + parseInt(a.minutos_final);
    }
  });
  const topSalidas = Object.entries(salidasPorDocente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  destroyChart('chart-salidas-antes');
  chartsInstances['chart-salidas-antes'] = new Chart(document.getElementById('chart-salidas-antes'), {
    type: 'bar',
    data: {
      labels: topSalidas.map(x => x[0]),
      datasets: [{
        label: 'Minutos Anticipados',
        data: topSalidas.map(x => x[1]),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartOptionsDefault,
      indexAxis: 'y',
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });

  // 2. CLASES PERDIDAS VS REPUESTAS (TOP 5 MATERIAS)
  const materiasIncidencias = {};
  data.forEach(a => {
    const matName = a.materia_nombre;
    if (!materiasIncidencias[matName]) {
      materiasIncidencias[matName] = { perdidas: 0, repuestas: 0 };
    }
    if (a.dicto_clases === 'NO') {
      materiasIncidencias[matName].perdidas++;
    }
    if (a.reposicion === 'SI') {
      materiasIncidencias[matName].repuestas++;
    }
  });

  const topMateriasPerdidas = Object.entries(materiasIncidencias)
    .filter(([_, stats]) => stats.perdidas > 0 || stats.repuestas > 0)
    .sort((a, b) => b[1].perdidas - a[1].perdidas)
    .slice(0, 5);

  const materiasLabels = topMateriasPerdidas.map(x => x[0]);
  const perdidasList = topMateriasPerdidas.map(x => x[1].perdidas);
  const repuestasList = topMateriasPerdidas.map(x => x[1].repuestas);

  destroyChart('chart-perdidas-repuestas');
  chartsInstances['chart-perdidas-repuestas'] = new Chart(document.getElementById('chart-perdidas-repuestas'), {
    type: 'bar',
    data: {
      labels: materiasLabels,
      datasets: [
        {
          label: 'No Dictadas',
          data: perdidasList,
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          borderColor: '#f43f5e',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Repuestas',
          data: repuestasList,
          backgroundColor: 'rgba(6, 182, 212, 0.8)',
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      ...chartOptionsDefault,
      plugins: {
        ...chartOptionsDefault.plugins,
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const materiaNombre = context[0].label;
              const registrosMateria = data.filter(a => a.materia_nombre === materiaNombre && (a.dicto_clases === 'NO' || a.reposicion === 'SI'));
              const profesores = [...new Set(registrosMateria.map(a => a.docente_nombre))];
              return profesores.length > 0 ? 'Docente(s): ' + profesores.join(', ') : '';
            }
          }
        }
      }
    }
  });

  // 3. TOP 5 RETRASOS
  const retrasosPorDocente = {};
  data.forEach(a => {
    if (a.inicio === 'Con Retraso' && a.minutos_atraso) {
      retrasosPorDocente[a.docente_nombre] = (retrasosPorDocente[a.docente_nombre] || 0) + parseInt(a.minutos_atraso);
    }
  });
  const topRetrasos = Object.entries(retrasosPorDocente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  destroyChart('chart-retrasos');
  chartsInstances['chart-retrasos'] = new Chart(document.getElementById('chart-retrasos'), {
    type: 'bar',
    data: {
      labels: topRetrasos.map(x => x[0]),
      datasets: [{
        label: 'Minutos de Atraso',
        data: topRetrasos.map(x => x[1]),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartOptionsDefault,
      indexAxis: 'y',
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });

  // 4. MODALIDAD (DONUT)
  const presenciales = data.filter(a => a.dicto_clases === 'SI' && String(a.clase || '').toUpperCase().trim() === 'PRESENCIAL').length;
  const virtuales = data.filter(a => a.dicto_clases === 'SI' && String(a.clase || '').toUpperCase().trim() === 'VIRTUAL').length;

  destroyChart('chart-modalidad');
  chartsInstances['chart-modalidad'] = new Chart(document.getElementById('chart-modalidad'), {
    type: 'doughnut',
    data: {
      labels: ['Presencial', 'Virtual'],
      datasets: [{
        data: [presenciales, virtuales],
        backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(16, 185, 129, 0.85)'],
        borderColor: isLight ? '#fff' : '#1f2937',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, activeElements, chart) => {
        if (activeElements && activeElements.length > 0) {
          const activeElement = activeElements[0];
          const index = activeElement.index;
          const label = chart.data.labels[index];
          handleChartElementClick(chart.canvas.id, label);
        }
      },
      plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
    }
  });

  // 5. TOP 5 MATERIAS INCIDENCIAS
  const incidenciasPorMateria = {};
  data.forEach(a => {
    let inc = 0;
    if (a.dicto_clases === 'NO') inc++;
    if (a.inicio === 'Con Retraso') inc++;
    if (a.final_clase === 'Se fue antes') inc++;
    if (inc > 0) {
      incidenciasPorMateria[a.materia_nombre] = (incidenciasPorMateria[a.materia_nombre] || 0) + inc;
    }
  });
  const topMaterias = Object.entries(incidenciasPorMateria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  destroyChart('chart-materias-incidencias');
  chartsInstances['chart-materias-incidencias'] = new Chart(document.getElementById('chart-materias-incidencias'), {
    type: 'bar',
    data: {
      labels: topMaterias.map(x => x[0]),
      datasets: [{
        label: 'Incidencias (Retrasos, Salidas, Faltas)',
        data: topMaterias.map(x => x[1]),
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: '#ec4899',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartOptionsDefault,
      indexAxis: 'y',
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { display: false }, ticks: { color: textColor } }
      },
      plugins: {
        ...chartOptionsDefault.plugins,
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const materiaNombre = context[0].label;
              const registrosMateria = data.filter(a => a.materia_nombre === materiaNombre && (a.dicto_clases === 'NO' || a.inicio === 'Con Retraso' || a.final_clase === 'Se fue antes'));
              const profesores = [...new Set(registrosMateria.map(a => a.docente_nombre))];
              return profesores.length > 0 ? 'Docente(s): ' + profesores.join(', ') : '';
            }
          }
        }
      }
    }
  });

  // 6. RESUMEN IDIOMA DICTADO (EXCLUYE NATIVAS DE INGLÉS)
  const materiasIngles = maestrosData.materias.filter(m => m.idioma_predeterminado === 'Inglés' && !m.nombre.trim().startsWith('Inglés') && !m.nombre.trim().startsWith('Ingles')).map(m => m.id);
  const inglesSi = data.filter(a => a.dicto_clases === 'SI' && a.idioma_dictado === 'Inglés' && materiasIngles.includes(a.materia_id)).length;
  const inglesNo = data.filter(a => a.dicto_clases === 'SI' && a.idioma_dictado === 'Español' && materiasIngles.includes(a.materia_id)).length;

  const totalClasesIngles = inglesSi + inglesNo;
  dbValIdiomaIng.textContent = totalClasesIngles > 0 ? `${inglesSi}/${totalClasesIngles}` : '0/0';

  destroyChart('chart-idioma');
  chartsInstances['chart-idioma'] = new Chart(document.getElementById('chart-idioma'), {
    type: 'doughnut',
    data: {
      labels: ['En inglés', 'En Español (Desvío)'],
      datasets: [{
        data: [inglesSi, inglesNo],
        backgroundColor: ['rgba(99, 102, 241, 0.85)', 'rgba(244, 63, 94, 0.85)'],
        borderColor: isLight ? '#fff' : '#1f2937',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      onClick: (event, activeElements, chart) => {
        if (activeElements && activeElements.length > 0) {
          const activeElement = activeElements[0];
          const index = activeElement.index;
          const label = chart.data.labels[index];
          handleChartElementClick(chart.canvas.id, label);
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // 7. CUMPLIMIENTO IDIOMA POR ASIGNATURA (EXCLUYE NATIVAS DE INGLÉS)
  const materiasPlanIngles = maestrosData.materias.filter(m => m.idioma_predeterminado === 'Inglés' && !m.nombre.trim().startsWith('Inglés') && !m.nombre.trim().startsWith('Ingles'));
  const etiquetasMaterias = [];
  const dictadoInglesList = [];
  const dictadoEspanolList = [];

  materiasPlanIngles.forEach(m => {
    const asistenciasMateria = data.filter(a => a.materia_id === m.id && a.dicto_clases === 'SI');
    if (asistenciasMateria.length > 0) {
      etiquetasMaterias.push(m.nombre);
      const enIngles = asistenciasMateria.filter(a => a.idioma_dictado === 'Inglés').length;
      const enEspanol = asistenciasMateria.filter(a => a.idioma_dictado === 'Español').length;
      dictadoInglesList.push(enIngles);
      dictadoEspanolList.push(enEspanol);
    }
  });

  destroyChart('chart-cumplimiento-idioma');
  chartsInstances['chart-cumplimiento-idioma'] = new Chart(document.getElementById('chart-cumplimiento-idioma'), {
    type: 'bar',
    data: {
      labels: etiquetasMaterias,
      datasets: [
        {
          label: 'Dictado en inglés',
          data: dictadoInglesList,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Dictado en Español (Desvío)',
          data: dictadoEspanolList,
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          borderColor: '#f43f5e',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      ...chartOptionsDefault,
      plugins: {
        ...chartOptionsDefault.plugins,
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const materiaNombre = context[0].label;
              const registrosMateria = data.filter(a => a.materia_nombre === materiaNombre && a.dicto_clases === 'SI');
              const profesores = [...new Set(registrosMateria.map(a => a.docente_nombre))];
              return profesores.length > 0 ? 'Docente(s): ' + profesores.join(', ') : '';
            }
          }
        }
      }
    }
  });

  // 8. TENDENCIA DE REGISTROS POR FECHA
  const registrosPorFecha = {};
  data.forEach(a => {
    registrosPorFecha[a.fecha] = (registrosPorFecha[a.fecha] || 0) + 1;
  });
  const tendenciaOrdenada = Object.entries(registrosPorFecha)
    .sort((a, b) => a[0].localeCompare(b[0]));

  destroyChart('chart-tendencia');
  chartsInstances['chart-tendencia'] = new Chart(document.getElementById('chart-tendencia'), {
    type: 'line',
    data: {
      labels: tendenciaOrdenada.map(x => formatearFechaTabla(x[0])),
      datasets: [{
        label: 'Clases Registradas',
        data: tendenciaOrdenada.map(x => x[1]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: chartOptionsDefault
  });
}

// Rellenar las 6 tablas compactas
function renderizarTablasIncidencias(data) {
  // 1. LLEGADAS TARDE
  const tbodyRetrasos = document.getElementById('db-table-retrasos-tbody');
  tbodyRetrasos.innerHTML = '';
  const retrasos = data.filter(a => a.dicto_clases === 'SI' && a.inicio === 'Con Retraso')
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (retrasos.length === 0) {
    tbodyRetrasos.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Sin incidencias de atraso</td></tr>';
  } else {
    retrasos.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.docente_nombre}</strong></td>
        <td>${r.materia_nombre}</td>
        <td><span class="badge warning" style="background: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.25); font-weight: bold; padding: 4px 8px; font-size: 10px;">+${r.minutos_atraso} min</span></td>
        <td>${formatearFechaTabla(r.fecha)}</td>
      `;
      tbodyRetrasos.appendChild(tr);
    });
  }

  // 2. SALIDAS ANTICIPADAS
  const tbodySalida = document.getElementById('db-table-salida-tbody');
  tbodySalida.innerHTML = '';
  const salidas = data.filter(a => a.dicto_clases === 'SI' && a.final_clase === 'Se fue antes')
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (salidas.length === 0) {
    tbodySalida.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Sin salidas anticipadas</td></tr>';
  } else {
    salidas.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${s.docente_nombre}</strong></td>
        <td>${s.materia_nombre}</td>
        <td><span class="badge no" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.25); font-weight: bold; padding: 4px 8px; font-size: 10px;">-${s.minutos_final} min</span></td>
        <td>${formatearFechaTabla(s.fecha)}</td>
      `;
      tbodySalida.appendChild(tr);
    });
  }

  // 3. CLASES NO DICTADAS
  const tbodyNoDictada = document.getElementById('db-table-nodictada-tbody');
  tbodyNoDictada.innerHTML = '';
  const noDictadas = data.filter(a => a.dicto_clases === 'NO')
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  
  if (noDictadas.length === 0) {
    tbodyNoDictada.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Sin clases perdidas</td></tr>';
  } else {
    noDictadas.forEach(nd => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${nd.docente_nombre}</strong></td>
        <td>${nd.materia_nombre}</td>
        <td style="color:#ef4444; font-style:italic;">${nd.comentarios || 'Sin observaciones'}</td>
        <td>${formatearFechaTabla(nd.fecha)}</td>
      `;
      tbodyNoDictada.appendChild(tr);
    });
  }

  // 4. CLASES REPUESTAS
  const tbodyRepuesta = document.getElementById('db-table-repuesta-tbody');
  tbodyRepuesta.innerHTML = '';
  const rep = data.filter(a => a.reposicion === 'SI')
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  
  if (rep.length === 0) {
    tbodyRepuesta.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Sin clases repuestas</td></tr>';
  } else {
    rep.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.docente_nombre}</strong></td>
        <td>${r.materia_nombre}</td>
        <td style="color:#06b6d4;">Clase repuesta</td>
        <td>${formatearFechaTabla(r.fecha)}</td>
      `;
      tbodyRepuesta.appendChild(tr);
    });
  }

  // 5. INCUMPLIMIENTO DE IDIOMA (EXCLUYE NATIVAS DE INGLÉS)
  const tbodyIdioma = document.getElementById('db-table-idioma-tbody');
  tbodyIdioma.innerHTML = '';
  const materiasInglesIds = maestrosData.materias.filter(m => m.idioma_predeterminado === 'Inglés' && !m.nombre.trim().startsWith('Inglés') && !m.nombre.trim().startsWith('Ingles')).map(m => m.id);
  const desviosIdioma = data.filter(a => a.dicto_clases === 'SI' && a.idioma_dictado === 'Español' && materiasInglesIds.includes(a.materia_id))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (desviosIdioma.length === 0) {
    tbodyIdioma.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Sin incumplimientos de idioma</td></tr>';
  } else {
    desviosIdioma.forEach(di => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${di.docente_nombre}</strong></td>
        <td>${di.materia_nombre}</td>
        <td>${formatearFechaTabla(di.fecha)}</td>
      `;
      tbodyIdioma.appendChild(tr);
    });
  }

  // 6. MODALIDAD VIRTUAL
  const tbodyVirtual = document.getElementById('db-table-virtual-tbody');
  tbodyVirtual.innerHTML = '';
  const virt = data.filter(a => a.dicto_clases === 'SI' && String(a.clase || '').toUpperCase().trim() === 'VIRTUAL')
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (virt.length === 0) {
    tbodyVirtual.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Sin clases virtuales registradas</td></tr>';
  } else {
    virt.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${v.docente_nombre}</strong></td>
        <td>${v.materia_nombre}</td>
        <td>${formatearFechaTabla(v.fecha)}</td>
      `;
      tbodyVirtual.appendChild(tr);
    });
  }

  // 7. RESUMEN DE FALTAS VS REPUESTAS POR MATERIA
  const tbodyResumenFaltas = document.getElementById('db-table-resumen-faltas-tbody');
  if (tbodyResumenFaltas) {
    tbodyResumenFaltas.innerHTML = '';
    const resumenFaltas = {};
    data.forEach(a => {
      const matName = a.materia_nombre;
      if (!resumenFaltas[matName]) {
        resumenFaltas[matName] = { faltas: 0, repuestas: 0 };
      }
      if (a.dicto_clases === 'NO') {
        resumenFaltas[matName].faltas++;
      }
      if (a.reposicion === 'SI') {
        resumenFaltas[matName].repuestas++;
      }
    });

    const materiasConFaltas = Object.entries(resumenFaltas)
      .filter(([_, stats]) => stats.faltas > 0)
      .sort((a, b) => b[1].faltas - a[1].faltas);

    if (materiasConFaltas.length === 0) {
      tbodyResumenFaltas.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Sin materias con faltas registradas</td></tr>';
    } else {
      materiasConFaltas.forEach(([nombreMateria, stats]) => {
        // Obtener docentes de esta materia en los datos filtrados actual
        const registrosMateria = data.filter(a => a.materia_nombre === nombreMateria);
        const profesores = [...new Set(registrosMateria.map(a => a.docente_nombre))];
        const profesoresTexto = profesores.length > 0 ? profesores.join(', ') : 'No disponible';

        const tr = document.createElement('tr');
        const txtFaltas = `${stats.faltas} ${stats.faltas === 1 ? 'falta' : 'faltas'}`;
        const txtRepuestas = `${stats.repuestas} ${stats.repuestas === 1 ? 'repuesta' : 'repuestas'}`;
        tr.innerHTML = `
          <td title="Docente(s): ${profesoresTexto}" style="cursor: help;"><strong>${nombreMateria}</strong></td>
          <td><span class="db-badge no" style="background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.25); font-weight: bold; padding: 4px 8px; font-size: 10px; white-space: nowrap; display: inline-block;">${txtFaltas}</span></td>
          <td><span class="db-badge yes" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); font-weight: bold; padding: 4px 8px; font-size: 10px; white-space: nowrap; display: inline-block;">${txtRepuestas}</span></td>
        `;
        tbodyResumenFaltas.appendChild(tr);
      });
    }
  }

  lucide.createIcons();
}

// Utilidad para formatear fechas
function formatearFechaTabla(fechaString) {
  if (!fechaString) return '';
  const partes = fechaString.split('-');
  if (partes.length !== 3) return fechaString;
  return `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
}

// Toast local
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast || !toastMsg || !toastIcon) return;

  toastMsg.textContent = message;

  // Clases y colores
  toast.className = 'toast animate-fade';
  if (type === 'success') {
    toast.style.borderLeft = '4px solid #10b981';
    toastIcon.setAttribute('data-lucide', 'check-circle');
    toastIcon.style.color = '#10b981';
  } else if (type === 'error') {
    toast.style.borderLeft = '4px solid #ef4444';
    toastIcon.setAttribute('data-lucide', 'alert-circle');
    toastIcon.style.color = '#ef4444';
  } else {
    toast.style.borderLeft = '4px solid #3b82f6';
    toastIcon.setAttribute('data-lucide', 'info');
    toastIcon.style.color = '#3b82f6';
  }

  lucide.createIcons();

  toast.style.display = 'flex';

  // Ocultar tras 3 segundos
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Procesar clics en elementos de gráficos (filtrado dinámico interactivo)
function handleChartElementClick(canvasId, label) {
  if (!label) return;

  if (canvasId === 'chart-salidas-antes' || canvasId === 'chart-retrasos') {
    const docente = maestrosData.docentes.find(d => d.nombre.trim() === label.trim());
    if (docente) {
      dbFilterProfesor.value = docente.id;
      actualizarDashboard();
      showToast(`Filtrado por Profesor: ${docente.nombre}`, 'success');
    }
  } else if (canvasId === 'chart-perdidas-repuestas' || canvasId === 'chart-materias-incidencias' || canvasId === 'chart-cumplimiento-idioma') {
    const materia = maestrosData.materias.find(m => m.nombre.trim() === label.trim());
    if (materia) {
      dbFilterMateria.value = materia.id;
      actualizarDashboard();
      showToast(`Filtrado por Materia: ${materia.nombre}`, 'success');
    }
  } else if (canvasId === 'chart-modalidad') {
    if (label === 'Virtual') {
      dbMetricFilter = 'virtuales';
      document.querySelectorAll('.db-metric-card').forEach(c => {
        if (c.id === 'db-card-virtuales') c.classList.add('active');
        else c.classList.remove('active');
      });
      actualizarDashboard();
      showToast('Filtrado por: Clases Virtuales', 'success');
    } else if (label === 'Presencial') {
      dbMetricFilter = null;
      document.querySelectorAll('.db-metric-card').forEach(c => {
        c.classList.remove('active');
      });
      actualizarDashboard();
      showToast('Filtro de modalidad presencial', 'info');
    }
  } else if (canvasId === 'chart-idioma') {
    if (label === 'En Español (Desvío)') {
      showToast('Mostrando desvíos de idioma en tablas inferiores', 'info');
    }
  } else if (canvasId === 'chart-tendencia') {
    const partes = label.split('/');
    if (partes.length === 2) {
      const dia = partes[0];
      const mes = partes[1];
      const coincidencia = asistenciasData.find(a => {
        const aPartes = a.fecha.split('-');
        return aPartes[2] === dia && aPartes[1] === mes;
      });
      if (coincidencia) {
        dbFilterDesde.value = coincidencia.fecha;
        dbFilterHasta.value = coincidencia.fecha;
        actualizarDashboard();
        showToast(`Filtrado por Fecha: ${dia}/${mes}`, 'success');
      }
    }
  }
}
