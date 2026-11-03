// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://fquascdipcgxrprfacyf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ELKC1Tym8k-nhnkB6iQNjQ_FXX7iQGz';

// Inicializar el cliente oficial de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// ESTADO GLOBAL DE LA APP
// ==========================================
let allOpportunities = [];
const userLikedIds = new Set(JSON.parse(localStorage.getItem('user_likes') || '[]'));

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const opportunitiesGrid = document.getElementById('opportunities-grid');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');

// Métricas
const statTotal = document.getElementById('stat-total');
const statCities = document.getElementById('stat-cities');
const statCountries = document.getElementById('stat-countries');
const statLikes = document.getElementById('stat-likes');

// Filtros
const searchInput = document.getElementById('search-input');
const filterCountry = document.getElementById('filter-country');
const filterCity = document.getElementById('filter-city');
const filterCategory = document.getElementById('filter-category');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Modal y Formulario
const btnOpenForm = document.getElementById('btn-open-form');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelForm = document.getElementById('btn-cancel-form');
const modalOverlay = document.getElementById('modal-form-overlay');
const opportunityForm = document.getElementById('opportunity-form');
const btnSubmitForm = document.getElementById('btn-submit-form');
const btnSubmitText = document.getElementById('btn-submit-text');
const btnSubmitSpinner = document.getElementById('btn-submit-spinner');

// Toast
const toast = document.getElementById('toast');

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  fetchOpportunities();
  setupEventListeners();
  setupRealtimeSubscription();
});

// ==========================================
// LECTURA DE DATOS DESDE SUPABASE
// ==========================================
async function fetchOpportunities(showLoading = true) {
  if (showLoading) {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    opportunitiesGrid.innerHTML = '';
  }

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    allOpportunities = data || [];
    populateDynamicFilters();
    applyFilters();
    updateStats();

  } catch (err) {
    console.error('Error al obtener oportunidades:', err);
    showToast('❌ Error al conectar con Supabase: ' + (err.message || 'Verifica tu conexión'), 'error');
  } finally {
    loadingState.classList.add('hidden');
  }
}

// ==========================================
// RENDERIZADO DE TARJETAS
// ==========================================
function renderOpportunities(list) {
  opportunitiesGrid.innerHTML = '';
  resultsCount.textContent = `${list.length} ${list.length === 1 ? 'oportunidad' : 'oportunidades'}`;

  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  list.forEach(opp => {
    const isLiked = userLikedIds.has(opp.id);
    const card = document.createElement('article');
    card.className = 'opp-card';
    card.dataset.id = opp.id;

    // Normalizar potencial para la clase CSS
    const potentialClass = `badge-potential-${(opp.potential || 'medio').toLowerCase()}`;
    
    // Formatear fecha
    const dateFormatted = new Date(opp.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    card.innerHTML = `
      <div class="opp-card-header">
        <h3 class="opp-title">${escapeHTML(opp.name)}</h3>
      </div>

      <div class="badges-row">
        <span class="badge badge-category">${escapeHTML(opp.category || 'General')}</span>
        <span class="badge ${potentialClass}">Potencial ${escapeHTML(opp.potential || 'Medio')}</span>
      </div>

      <div class="location-tag">
        <span>📍</span>
        <span>${escapeHTML(opp.city)}, ${escapeHTML(opp.country)}</span>
      </div>

      <div class="block-section block-problem">
        <div class="block-title">⚠️ Problema Detectado</div>
        <p class="block-desc">${escapeHTML(opp.problem)}</p>
      </div>

      <div class="block-section block-solution ai-solution">
        <div class="block-title">✨ Solución con IA</div>
        <p class="block-desc">${escapeHTML(opp.ai_solution)}</p>
      </div>

      <div class="opp-card-footer">
        <span class="date-text">Publicado el ${dateFormatted}</span>
        <button class="btn-like ${isLiked ? 'liked' : ''}" data-id="${opp.id}" data-likes="${opp.likes}">
          <span class="heart-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="like-count">${opp.likes}</span>
        </button>
      </div>
    `;

    // Event listener para el botón de Like
    const likeBtn = card.querySelector('.btn-like');
    likeBtn.addEventListener('click', () => handleLike(opp.id, opp.likes));

    opportunitiesGrid.appendChild(card);
  });
}

// ==========================================
// FILTRADO Y BÚSQUEDA
// ==========================================
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const country = filterCountry.value;
  const city = filterCity.value;
  const category = filterCategory.value;

  const filtered = allOpportunities.filter(opp => {
    // Búsqueda libre
    const matchesQuery = !query || 
      (opp.name && opp.name.toLowerCase().includes(query)) ||
      (opp.problem && opp.problem.toLowerCase().includes(query)) ||
      (opp.ai_solution && opp.ai_solution.toLowerCase().includes(query)) ||
      (opp.city && opp.city.toLowerCase().includes(query));

    // Filtros exactos
    const matchesCountry = !country || opp.country === country;
    const matchesCity = !city || opp.city === city;
    const matchesCategory = !category || opp.category === category;

    return matchesQuery && matchesCountry && matchesCity && matchesCategory;
  });

  renderOpportunities(filtered);
}

function populateDynamicFilters() {
  const currentCountry = filterCountry.value;
  const currentCity = filterCity.value;

  // Extraer países únicos
  const countries = [...new Set(allOpportunities.map(o => o.country).filter(Boolean))].sort();
  filterCountry.innerHTML = '<option value="">Todos los países</option>';
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === currentCountry) opt.selected = true;
    filterCountry.appendChild(opt);
  });

  // Extraer ciudades únicas (según país seleccionado o todas)
  const availableCities = currentCountry 
    ? allOpportunities.filter(o => o.country === currentCountry).map(o => o.city)
    : allOpportunities.map(o => o.city);

  const cities = [...new Set(availableCities.filter(Boolean))].sort();
  filterCity.innerHTML = '<option value="">Todas las ciudades</option>';
  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === currentCity) opt.selected = true;
    filterCity.appendChild(opt);
  });
}

function resetFilters() {
  searchInput.value = '';
  filterCountry.value = '';
  filterCity.value = '';
  filterCategory.value = '';
  populateDynamicFilters();
  applyFilters();
}

// ==========================================
// DAR LIKE (ACTUALIZAR EN SUPABASE)
// ==========================================
async function handleLike(opportunityId, currentLikes) {
  try {
    // 1. Intentar llamar a la función RPC atómica increment_likes en Supabase
    let newLikes = currentLikes + 1;
    const { data, error: rpcError } = await supabase.rpc('increment_likes', {
      opportunity_id: opportunityId
    });

    if (rpcError) {
      // Si la función RPC no está disponible, actualizar directamente
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ likes: currentLikes + 1 })
        .eq('id', opportunityId);

      if (updateError) throw updateError;
    } else if (typeof data === 'number') {
      newLikes = data;
    }

    // Registrar like localmente para estilo
    userLikedIds.add(opportunityId);
    localStorage.setItem('user_likes', JSON.stringify([...userLikedIds]));

    // Actualizar en memoria y en pantalla inmediatamente
    const opp = allOpportunities.find(o => o.id === opportunityId);
    if (opp) opp.likes = newLikes;

    applyFilters();
    updateStats();
    showToast('❤️ ¡Like registrado y guardado en Supabase!', 'success');

  } catch (err) {
    console.error('Error al dar like:', err);
    showToast('❌ No se pudo registrar el like: ' + err.message, 'error');
  }
}

// ==========================================
// PUBLICAR NUEVA OPORTUNIDAD (INSERTAR EN SUPABASE)
// ==========================================
async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('form-name').value.trim();
  const city = document.getElementById('form-city').value.trim();
  const country = document.getElementById('form-country').value.trim();
  const category = document.getElementById('form-category').value;
  const potential = document.getElementById('form-potential').value;
  const problem = document.getElementById('form-problem').value.trim();
  const ai_solution = document.getElementById('form-solution').value.trim();

  if (!name || !city || !country || !category || !potential || !problem || !ai_solution) {
    showToast('⚠️ Por favor completa todos los campos requeridos', 'error');
    return;
  }

  // Activar estado de carga en botón
  btnSubmitForm.disabled = true;
  btnSubmitText.textContent = 'Guardando en Supabase...';
  btnSubmitSpinner.classList.remove('hidden');

  try {
    const newOpportunity = {
      name,
      city,
      country,
      category,
      potential,
      problem,
      ai_solution,
      likes: 0
    };

    const { data, error } = await supabase
      .from('opportunities')
      .insert([newOpportunity])
      .select();

    if (error) {
      throw error;
    }

    showToast('🎉 ¡Oportunidad publicada y guardada exitosamente en Supabase!', 'success');
    opportunityForm.reset();
    closeModal();

    // Recargar la lista desde Supabase para tener el ID y timestamp frescos
    await fetchOpportunities(false);

  } catch (err) {
    console.error('Error al insertar oportunidad:', err);
    showToast('❌ Error al guardar en Supabase: ' + err.message, 'error');
  } finally {
    btnSubmitForm.disabled = false;
    btnSubmitText.textContent = 'Guardar en Supabase';
    btnSubmitSpinner.classList.add('hidden');
  }
}

// ==========================================
// SUSCRIPCIÓN EN TIEMPO REAL (REALTIME)
// ==========================================
function setupRealtimeSubscription() {
  try {
    supabase
      .channel('opportunities_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, payload => {
        console.log('Cambio detectado en Supabase en tiempo real:', payload);
        // Recargar en segundo plano sin interrumpir la vista
        fetchOpportunities(false);
        if (payload.eventType === 'INSERT') {
          showToast('🔔 ¡Alguien acaba de publicar una nueva oportunidad!', 'info');
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime no se pudo activar:', err);
  }
}

// ==========================================
// ESTADÍSTICAS RÁPIDAS
// ==========================================
function updateStats() {
  const total = allOpportunities.length;
  const uniqueCities = new Set(allOpportunities.map(o => o.city.toLowerCase())).size;
  const uniqueCountries = new Set(allOpportunities.map(o => o.country.toLowerCase())).size;
  const totalLikes = allOpportunities.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  statTotal.textContent = total;
  statCities.textContent = uniqueCities;
  statCountries.textContent = uniqueCountries;
  statLikes.textContent = totalLikes;
}

// ==========================================
// UTILIDADES Y EVENTOS DE UI
// ==========================================
function setupEventListeners() {
  // Modal
  btnOpenForm.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelForm.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Tecla Escape para cerrar modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Formulario
  opportunityForm.addEventListener('submit', handleFormSubmit);

  // Filtros
  searchInput.addEventListener('input', applyFilters);
  filterCategory.addEventListener('change', applyFilters);
  filterCountry.addEventListener('change', () => {
    populateDynamicFilters();
    applyFilters();
  });
  filterCity.addEventListener('change', applyFilters);
  btnResetFilters.addEventListener('click', resetFilters);
}

function openModal() {
  modalOverlay.classList.remove('hidden');
  document.getElementById('form-name').focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

