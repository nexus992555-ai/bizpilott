(function () {
  window.BizUiFilters = {
    bookingsSearch: '',
    bookingsStatus: 'all',
    clientsSearch: '',
    clientsSegment: 'all',
    catalogTab: 'all',
    catalogSearch: ''
  };

  const $ = (id) => document.getElementById(id);

  function showToast(message) {
    const container = $('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-dot"></span><span>${window.BizViews.esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 180ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function applyThemeAndNicheTokens(state, cfg) {
    document.documentElement.setAttribute('data-theme', state.theme || 'light');
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--accent', cfg.accent);
    rootStyle.setProperty('--accent-hover', cfg.accentHover);
    rootStyle.setProperty('--accent-soft', cfg.accentSoft);
    rootStyle.setProperty('--accent-ring', cfg.accentRing);
  }

  function renderChrome(state, cfg, data) {
    // Static icon slots
    $('sidebar-collapse-btn').innerHTML = window.BizIcons.svg('sidebar', 17);
    $('mobile-menu-btn').innerHTML = window.BizIcons.svg('menu', 18);
    $('niche-chevron-icon').innerHTML = window.BizIcons.svg('chevronDown', 15);
    $('topbar-search-icon').innerHTML = window.BizIcons.svg('search', 15);
    $('notifications-icon-slot').innerHTML = window.BizIcons.svg('bell', 17);
    $('quick-create-icon').innerHTML = window.BizIcons.svg('plus', 15);
    $('drawer-close-btn').innerHTML = window.BizIcons.svg('close', 18);
    $('modal-close-btn').innerHTML = window.BizIcons.svg('close', 18);
    $('cmdk-search-icon').innerHTML = window.BizIcons.svg('search', 17);
    $('theme-toggle-btn').innerHTML = window.BizIcons.svg(state.theme === 'dark' ? 'sun' : 'moon', 16);

    // Sidebar state
    $('sidebar').classList.toggle('collapsed', Boolean(state.sidebarCollapsed));

    // Current niche switcher
    $('current-niche-icon').innerHTML = window.BizIcons.svg(cfg.icon, 17);
    $('current-business-name').textContent = data.businessName || cfg.name;
    $('current-niche-label').textContent = cfg.name;
    $('shift-hours').textContent = data.hours;

    const ownerDisplay = (window.BizStore.getAuthUser()?.name) || state.ownerName || 'Управляющий';
    $('owner-name').textContent = ownerDisplay;
    $('owner-avatar').textContent = window.BizViews.initials(ownerDisplay);

    const authUser = window.BizStore.getAuthUser();
    const authBtn = $('auth-btn');
    if (authBtn) {
      authBtn.textContent = authUser ? authUser.email : 'Войти';
      authBtn.title = authUser ? 'Аккаунт синхронизирован с базой данных' : 'Войти или создать аккаунт';
    }
    const roleEl = document.querySelector('.user-role');
    if (roleEl) {
      roleEl.textContent = authUser ? 'Облако • БД активна' : 'Локальный режим';
    }

    // Niche dropdown list
    $('niche-dropdown-list').innerHTML = window.BizNiches.NICHE_ORDER.map((id) => {
      const n = window.BizNiches.NICHES[id];
      const active = id === state.activeNiche;
      return `
        <button class="niche-option ${active ? 'active' : ''}" data-select-niche="${id}" type="button">
          <div class="niche-option-dot" style="background:${n.accentSoft}; color:${n.accent};">
            ${window.BizIcons.svg(n.icon, 15)}
          </div>
          <div class="niche-option-text">
            <span class="niche-option-title">${window.BizViews.esc(n.name)}</span>
            <span class="niche-option-sub">${window.BizViews.esc(n.defaultBusinessName)}</span>
          </div>
          ${active ? window.BizIcons.svg('check', 15) : ''}
        </button>
      `;
    }).join('');

    // Navigation items adapted to niche
    const todayCount = data.bookings.filter((b) => b.date === window.BizNiches.today && b.status !== 'cancelled').length;
    const navGroups = [
      {
        title: 'Операции',
        items: [
          { id: 'dashboard', label: 'Главная панель', icon: 'dashboard' },
          { id: 'calendar', label: 'Календарь', icon: 'calendar', badge: todayCount || null },
          { id: 'bookings', label: cfg.terms.bookingsPlural, icon: 'bookings', badge: data.bookings.length }
        ]
      },
      {
        title: 'Управление',
        items: [
          { id: 'clients', label: `CRM: ${cfg.terms.clientsPlural}`, icon: 'clients', badge: data.clients.length },
          { id: 'catalog', label: 'Услуги и товары', icon: 'catalog' },
          { id: 'staff', label: cfg.terms.staffPlural, icon: 'staff' }
        ]
      },
      {
        title: 'Система',
        items: [
          { id: 'analytics', label: 'Аналитика', icon: 'analytics' },
          { id: 'settings', label: 'Настройки', icon: 'settings' }
        ]
      }
    ];

    $('sidebar-nav').innerHTML = navGroups.map((grp) => `
      <div class="nav-section-title">${grp.title}</div>
      ${grp.items.map((item) => `
        <button class="nav-item ${state.activeView === item.id ? 'active' : ''}" data-nav="${item.id}" type="button" title="${window.BizViews.esc(item.label)}">
          <span class="nav-icon">${window.BizIcons.svg(item.icon, 17)}</span>
          <span class="nav-label">${window.BizViews.esc(item.label)}</span>
          ${item.badge ? `<span class="nav-badge tabular-nums">${item.badge}</span>` : ''}
        </button>
      `).join('')}
    `).join('');

    // Topbar
    const allItems = navGroups.flatMap((g) => g.items);
    const activeItem = allItems.find((i) => i.id === state.activeView) || allItems[0];
    $('topbar-niche-pill').textContent = cfg.shortName;
    $('page-title').textContent = activeItem.label;
    $('quick-create-label').textContent = cfg.terms.createBooking;
    const searchPh = document.querySelector('#command-palette-trigger .search-placeholder');
    if (searchPh) {
      searchPh.textContent = `Поиск: ${cfg.terms.clientsPlural.toLowerCase()}, ${cfg.terms.bookingsPlural.toLowerCase()}, каталог...`;
    }

    const nowFormatted = new Date().toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    });
    $('topbar-date').textContent = nowFormatted.charAt(0).toUpperCase() + nowFormatted.slice(1);

    const hasUnread = state.notifications.some((n) => n.unread);
    $('notif-badge').classList.toggle('hidden', !hasUnread);

    const demoBanner = $('demo-banner');
    if (demoBanner) {
      demoBanner.classList.toggle('hidden', !state.demoMode);
    }
  }

  function renderView() {
    const state = window.BizStore.getState();
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();

    applyThemeAndNicheTokens(state, cfg);
    renderChrome(state, cfg, data);

    const container = $('view-container');
    const activeId = document.activeElement?.id;
    const selStart = document.activeElement?.selectionStart;

    let html = '';
    switch (state.activeView) {
      case 'calendar':
        html = window.BizViews.renderCalendar(state, cfg, data);
        break;
      case 'bookings':
        html = window.BizViews.renderBookings(state, cfg, data);
        break;
      case 'clients':
        html = window.BizViews.renderClients(state, cfg, data);
        break;
      case 'catalog':
        html = window.BizViews.renderCatalog(state, cfg, data);
        break;
      case 'staff':
        html = window.BizViews.renderStaff(state, cfg, data);
        break;
      case 'analytics':
        html = window.BizViews.renderAnalytics(state, cfg, data);
        break;
      case 'settings':
        html = window.BizViews.renderSettings(state, cfg, data);
        break;
      case 'dashboard':
      default:
        html = window.BizViews.renderDashboard(state, cfg, data);
        break;
    }

    container.innerHTML = html;
    window.BizCharts.bindChartTooltips(container);
    bindViewDynamicInputs();

    if (activeId && $(activeId)) {
      const el = $(activeId);
      el.focus();
      if (typeof selStart === 'number' && el.setSelectionRange) {
        el.setSelectionRange(selStart, selStart);
      }
    }
  }

  function bindViewDynamicInputs() {
    const calPicker = $('calendar-date-picker');
    if (calPicker) {
      calPicker.addEventListener('change', (e) => {
        window.BizStore.setCalendarDate(e.target.value || window.BizNiches.today);
      });
    }

    const bkSearch = $('bookings-search-input');
    if (bkSearch) {
      bkSearch.addEventListener('input', (e) => {
        window.BizUiFilters.bookingsSearch = e.target.value;
        renderView();
      });
    }

    const clSearch = $('clients-search-input');
    if (clSearch) {
      clSearch.addEventListener('input', (e) => {
        window.BizUiFilters.clientsSearch = e.target.value;
        renderView();
      });
    }

    const catSearch = $('catalog-search-input');
    if (catSearch) {
      catSearch.addEventListener('input', (e) => {
        window.BizUiFilters.catalogSearch = e.target.value;
        renderView();
      });
    }

    const bizForm = $('business-profile-form');
    if (bizForm) {
      bizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(bizForm);
        window.BizStore.updateBusinessProfile({
          businessName: fd.get('businessName'),
          address: fd.get('address'),
          phone: fd.get('phone'),
          hours: fd.get('hours')
        });
        window.BizStore.updateGlobalSettings({ currency: fd.get('currency') });
        showToast('Профиль бизнеса обновлён');
      });
    }

    const smsForm = $('integrations-sms-form');
    if (smsForm) {
      smsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(smsForm);
        window.BizStore.updateGlobalSettings({
          settings: {
            smscLogin: (fd.get('smscLogin') || '').toString().trim(),
            smscPassword: (fd.get('smscPassword') || '').toString().trim(),
            smsTiming: (fd.get('smsTiming') || '2h').toString()
          }
        });
        showToast('Настройки SMSC.ru сохранены');
      });
    }
  }

  /* ==========================================================================
     Modals & Drawers
     ========================================================================== */

  function openModal(title, bodyHtml) {
    $('modal-title').textContent = title;
    $('modal-body').innerHTML = bodyHtml;
    $('modal-backdrop').classList.remove('hidden');
    $('app-modal').classList.remove('hidden');
  }

  function closeModal() {
    $('modal-backdrop').classList.add('hidden');
    $('app-modal').classList.add('hidden');
  }

  function openDrawer(eyebrow, title, bodyHtml) {
    $('drawer-eyebrow').textContent = eyebrow;
    $('drawer-title').textContent = title;
    $('drawer-body').innerHTML = bodyHtml;
    $('drawer-backdrop').classList.remove('hidden');
    $('app-drawer').classList.remove('hidden');
    $('app-drawer').setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    $('drawer-backdrop').classList.add('hidden');
    $('app-drawer').classList.add('hidden');
    $('app-drawer').setAttribute('aria-hidden', 'true');
  }

  function openCreateBookingModal(prefill = {}) {
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const esc = window.BizViews.esc;

    const activeServices = data.services.filter((s) => s.active);
    const firstSvc = activeServices.find((s) => s.id === prefill.serviceId) || activeServices[0];
    const hasClients = data.clients.length > 0;
    const hasServices = activeServices.length > 0;

    const body = `
      <form id="create-booking-form">
        <div class="form-grid">
          <div class="form-field full">
            <label class="form-label">${esc(cfg.terms.clientSingular)}</label>
            <select class="select" name="clientId" required>
              ${data.clients.map((c) => `<option value="${c.id}" ${prefill.clientId === c.id ? 'selected' : ''}>${esc(c.name)} (${esc(c.phone)})</option>`).join('')}
              <option value="__new__" ${!hasClients ? 'selected' : ''}>+ Новый ${esc(cfg.terms.clientSingular.toLowerCase())}</option>
            </select>
          </div>

          <div class="form-field full ${hasClients ? 'hidden' : ''}" id="inline-new-client-fields">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">Имя</label>
                <input class="input" name="newClientName" placeholder="Иван Петров" ${!hasClients ? 'required' : ''}>
              </div>
              <div class="form-field">
                <label class="form-label">Телефон</label>
                <input class="input" name="newClientPhone" placeholder="+7 (999) 000-00-00">
              </div>
            </div>
          </div>

          <div class="form-field full">
            <label class="form-label">Услуга / Позиция</label>
            <select class="select" name="serviceId" id="booking-service-select" required>
              ${activeServices.map((s) => `
                <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration || 60}" ${firstSvc && firstSvc.id === s.id ? 'selected' : ''}>
                  ${esc(s.name)} — ${window.BizStore.formatMoney(s.price)}
                </option>
              `).join('')}
              <option value="__new_svc__" ${!hasServices ? 'selected' : ''}>+ Новая услуга / позиция</option>
            </select>
          </div>

          <div class="form-field full ${hasServices ? 'hidden' : ''}" id="inline-new-service-fields">
            <label class="form-label">Название услуги / позиции</label>
            <input class="input" name="newServiceName" placeholder="Напр.: Базовая услуга" ${!hasServices ? 'required' : ''}>
          </div>

          <div class="form-field">
            <label class="form-label">${esc(cfg.terms.staffSingular)}</label>
            <select class="select" name="staffId">
              ${data.staff.length
                ? data.staff.map((st) => `<option value="${st.id}" ${prefill.staffId === st.id ? 'selected' : ''}>${esc(st.name)} (${esc(st.role)})</option>`).join('')
                : `<option value="">Не назначен</option>`}
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">Статус</label>
            <select class="select" name="status">
              ${Object.entries(cfg.terms.statusMap).map(([k, v]) => `<option value="${k}" ${k === 'confirmed' ? 'selected' : ''}>${esc(v)}</option>`).join('')}
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">Дата</label>
            <input class="input" type="date" name="date" value="${esc(prefill.date || window.BizNiches.today)}" required>
          </div>

          <div class="form-field">
            <label class="form-label">Время начала</label>
            <input class="input" type="time" name="time" value="${esc(prefill.time || '14:00')}" required>
          </div>

          <div class="form-field">
            <label class="form-label">Стоимость (${window.BizStore.getState().currency})</label>
            <input class="input tabular-nums" type="number" name="price" id="booking-price-input" value="${firstSvc ? firstSvc.price : 0}" min="0" required>
          </div>

          <div class="form-field">
            <label class="form-label">Длительность (мин)</label>
            <input class="input tabular-nums" type="number" name="duration" id="booking-duration-input" value="${firstSvc ? (firstSvc.duration || 60) : 60}" min="15" step="15" required>
          </div>

          <div class="form-field full">
            <label class="form-label">${esc(cfg.terms.extraFieldLabel)}</label>
            <input class="input" name="extra" placeholder="${esc(cfg.terms.extraFieldPlaceholder)}">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">${esc(cfg.terms.createBooking)}</button>
        </div>
      </form>
    `;

    openModal(cfg.terms.createBooking, body);

    const form = $('create-booking-form');
    const clientSel = form.querySelector('select[name="clientId"]');
    const inlineClientWrap = $('inline-new-client-fields');
    clientSel.addEventListener('change', () => {
      const isNew = clientSel.value === '__new__';
      inlineClientWrap.classList.toggle('hidden', !isNew);
      const nameInp = form.querySelector('input[name="newClientName"]');
      if (nameInp) nameInp.required = isNew;
    });

    const svcSel = $('booking-service-select');
    const inlineSvcWrap = $('inline-new-service-fields');
    svcSel.addEventListener('change', () => {
      const isNewSvc = svcSel.value === '__new_svc__';
      inlineSvcWrap.classList.toggle('hidden', !isNewSvc);
      const svcNameInp = form.querySelector('input[name="newServiceName"]');
      if (svcNameInp) svcNameInp.required = isNewSvc;
      const opt = svcSel.selectedOptions[0];
      if (!opt || isNewSvc) return;
      $('booking-price-input').value = opt.dataset.price || 0;
      $('booking-duration-input').value = opt.dataset.duration || 60;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      let clientId = fd.get('clientId');
      if (clientId === '__new__') {
        const newName = (fd.get('newClientName') || '').trim();
        const newPhone = (fd.get('newClientPhone') || '').trim() || '+7 (999) 000-00-00';
        if (!newName) {
          showToast('Укажите имя нового клиента');
          return;
        }
        const created = window.BizStore.addClient({ name: newName, phone: newPhone, segment: 'Новый' });
        clientId = created.id;
      }

      let serviceId = fd.get('serviceId');
      if (serviceId === '__new_svc__') {
        const svcName = (fd.get('newServiceName') || '').trim();
        if (!svcName) {
          showToast('Укажите название услуги');
          return;
        }
        const createdSvc = window.BizStore.addServiceOrProduct({
          kind: 'service',
          name: svcName,
          category: 'Основная',
          price: fd.get('price'),
          duration: fd.get('duration')
        });
        serviceId = createdSvc.id;
      }

      window.BizStore.addBooking({
        clientId,
        staffId: fd.get('staffId'),
        serviceId,
        date: fd.get('date'),
        time: fd.get('time'),
        duration: fd.get('duration'),
        price: fd.get('price'),
        status: fd.get('status'),
        extra: fd.get('extra')
      });
      closeModal();
      showToast(`Создано: ${cfg.terms.bookingSingular}`);
    });
  }

  function openCreateClientModal() {
    const cfg = window.BizStore.getNicheConfig();
    const esc = window.BizViews.esc;
    openModal(`Добавить: ${cfg.terms.clientSingular}`, `
      <form id="create-client-form">
        <div class="form-grid">
          <div class="form-field full">
            <label class="form-label">ФИО / Имя</label>
            <input class="input" name="name" placeholder="Напр.: Александр Смирнов" required>
          </div>
          <div class="form-field">
            <label class="form-label">Телефон</label>
            <input class="input" name="phone" placeholder="+7 (916) 000-00-00" required>
          </div>
          <div class="form-field">
            <label class="form-label">Сегмент</label>
            <select class="select" name="segment">
              <option value="Новый">Новый</option>
              <option value="Постоянный">Постоянный</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div class="form-field full">
            <label class="form-label">Метка / Особенность</label>
            <input class="input" name="tag" placeholder="Напр.: По рекомендации / Карта Gold">
          </div>
          <div class="form-field full">
            <label class="form-label">Комментарий</label>
            <textarea class="textarea" name="note" rows="3" placeholder="Предпочтения, детали..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">Сохранить профиль</button>
        </div>
      </form>
    `);

    $('create-client-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      window.BizStore.addClient({
        name: fd.get('name'),
        phone: fd.get('phone'),
        segment: fd.get('segment'),
        tag: fd.get('tag'),
        note: fd.get('note')
      });
      closeModal();
      showToast(`${cfg.terms.clientSingular} добавлен в CRM`);
    });
  }

  function openCreateServiceModal() {
    const cfg = window.BizStore.getNicheConfig();
    const esc = window.BizViews.esc;
    openModal('Новая позиция в каталоге', `
      <form id="create-service-form">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Тип</label>
            <select class="select" name="kind" id="service-kind-select">
              <option value="service">${esc(cfg.terms.serviceTab)}</option>
              <option value="product">${esc(cfg.terms.productTab)}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Категория</label>
            <input class="input" name="category" placeholder="Основная" required>
          </div>
          <div class="form-field full">
            <label class="form-label">Название</label>
            <input class="input" name="name" placeholder="Название услуги или товара" required>
          </div>
          <div class="form-field">
            <label class="form-label">Цена продажи</label>
            <input class="input tabular-nums" type="number" name="price" value="2500" min="0" required>
          </div>
          <div class="form-field">
            <label class="form-label">Себестоимость</label>
            <input class="input tabular-nums" type="number" name="cost" value="700" min="0">
          </div>
          <div class="form-field" id="svc-duration-field">
            <label class="form-label">Длительность (мин)</label>
            <input class="input tabular-nums" type="number" name="duration" value="60" min="15" step="15">
          </div>
          <div class="form-field hidden" id="svc-stock-field">
            <label class="form-label">Остаток на складе (шт)</label>
            <input class="input tabular-nums" type="number" name="stock" value="10" min="0">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">Добавить в каталог</button>
        </div>
      </form>
    `);

    const kindSel = $('service-kind-select');
    kindSel.addEventListener('change', () => {
      const isProd = kindSel.value === 'product';
      $('svc-duration-field').classList.toggle('hidden', isProd);
      $('svc-stock-field').classList.toggle('hidden', !isProd);
    });

    $('create-service-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      window.BizStore.addServiceOrProduct({
        kind: fd.get('kind'),
        name: fd.get('name'),
        category: fd.get('category'),
        price: fd.get('price'),
        cost: fd.get('cost'),
        duration: fd.get('duration'),
        stock: fd.get('stock')
      });
      closeModal();
      showToast('Позиция добавлена в каталог');
    });
  }

  function openCreateStaffModal() {
    const cfg = window.BizStore.getNicheConfig();
    const esc = window.BizViews.esc;
    openModal(`Новый сотрудник (${esc(cfg.terms.staffSingular)})`, `
      <form id="create-staff-form">
        <div class="form-grid">
          <div class="form-field full">
            <label class="form-label">Имя и фамилия</label>
            <input class="input" name="name" placeholder="Марина Соколова" required>
          </div>
          <div class="form-field">
            <label class="form-label">Должность / Специализация</label>
            <input class="input" name="role" placeholder="${esc(cfg.terms.staffSingular)}" required>
          </div>
          <div class="form-field">
            <label class="form-label">Комиссия / Ставка</label>
            <input class="input" name="commission" value="40%">
          </div>
          <div class="form-field">
            <label class="form-label">График смены</label>
            <input class="input" name="schedule" value="10:00 — 21:00">
          </div>
          <div class="form-field">
            <label class="form-label">Теги (через запятую)</label>
            <input class="input" name="tags" placeholder="PRO, Базовые услуги">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">Добавить в команду</button>
        </div>
      </form>
    `);

    $('create-staff-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      window.BizStore.addStaff({
        name: fd.get('name'),
        role: fd.get('role'),
        commission: fd.get('commission'),
        schedule: fd.get('schedule'),
        tags: fd.get('tags')
      });
      closeModal();
      showToast('Сотрудник добавлен в команду');
    });
  }

  function openBookingDrawer(bookingId) {
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const esc = window.BizViews.esc;
    const bk = data.bookings.find((b) => b.id === bookingId);
    if (!bk) return;

    const cl = data.clients.find((c) => c.id === bk.clientId);
    const st = data.staff.find((s) => s.id === bk.staffId);
    const sv = data.services.find((s) => s.id === bk.serviceId);

    const statusButtons = Object.entries(cfg.terms.statusMap).map(([key, label]) => `
      <button class="btn btn-sm ${bk.status === key ? 'btn-primary' : 'btn-secondary'}" data-set-booking-status="${key}" data-booking-id="${bk.id}">
        ${esc(label)}
      </button>
    `).join('');

    openDrawer(cfg.terms.bookingSingular, `${window.BizViews.formatDateRu(bk.date)}, ${bk.time}`, `
      <div class="card" style="padding:14px 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:12px; color:var(--text-muted);">Текущий статус</span>
          ${window.BizViews.statusPill(bk.status, cfg)}
        </div>
        <div style="font-size:22px; font-weight:700;" class="tabular-nums">${window.BizStore.formatMoney(bk.price)}</div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;">${esc(sv ? sv.name : 'Услуга')} • ${bk.duration || 60} мин</div>
      </div>

      <div>
        <div class="form-label" style="margin-bottom:8px;">Сменить статус в 1 клик</div>
        <div style="display:flex; flex-wrap:wrap; gap:7px;">${statusButtons}</div>
      </div>

      <div class="card" style="padding:14px 16px; display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span style="color:var(--text-muted);">${esc(cfg.terms.clientSingular)}</span>
          <button class="btn btn-ghost btn-sm" style="padding:0 4px;" data-open-client="${cl ? cl.id : ''}"><strong>${esc(cl ? cl.name : '—')}</strong></button>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span style="color:var(--text-muted);">Телефон</span>
          <span>${esc(cl ? cl.phone : '—')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span style="color:var(--text-muted);">${esc(cfg.terms.staffSingular)}</span>
          <strong>${esc(st ? st.name : '—')}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span style="color:var(--text-muted);">Источник</span>
          <span>${esc(bk.channel || '—')}</span>
        </div>
        <div style="font-size:13px; padding-top:8px; border-top:1px solid var(--border-subtle);">
          <div style="color:var(--text-muted); margin-bottom:3px;">${esc(cfg.terms.extraFieldLabel)}</div>
          <div>${esc(bk.extra || 'Без дополнительных пометок')}</div>
        </div>
      </div>

      <div style="margin-top:auto; display:flex; gap:10px;">
        <button class="btn btn-danger" style="flex:1;" data-delete-booking="${bk.id}">
          ${window.BizIcons.svg('trash', 15)} Удалить запись
        </button>
      </div>
    `);
  }

  function openClientDrawer(clientId) {
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const esc = window.BizViews.esc;
    const cl = data.clients.find((c) => c.id === clientId);
    if (!cl) return;

    const history = data.bookings.filter((b) => b.clientId === cl.id);

    openDrawer(`Карточка: ${cfg.terms.clientSingular}`, cl.name, `
      <div style="display:flex; align-items:center; gap:14px;">
        <div class="avatar lg">${esc(window.BizViews.initials(cl.name))}</div>
        <div>
          <div style="font-size:16px; font-weight:700;">${esc(cl.name)}</div>
          <div style="font-size:13px; color:var(--text-secondary);">${esc(cl.phone)}</div>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <span class="pill pill-accent">${esc(cl.segment)}</span>
            <span class="pill pill-neutral">${esc(cl.tag || 'Профиль')}</span>
          </div>
        </div>
      </div>

      <div class="staff-stats">
        <div>
          <div class="staff-stat-val tabular-nums">${window.BizStore.formatMoney(cl.ltv)}</div>
          <div class="staff-stat-lbl">Общий LTV</div>
        </div>
        <div>
          <div class="staff-stat-val tabular-nums">${cl.visits}</div>
          <div class="staff-stat-lbl">Визитов</div>
        </div>
        <div>
          <div class="staff-stat-val">${window.BizViews.formatDateRu(cl.lastVisit)}</div>
          <div class="staff-stat-lbl">Последний</div>
        </div>
      </div>

      <div>
        <label class="form-label" style="display:block; margin-bottom:6px;">Персональная заметка</label>
        <textarea class="textarea" id="drawer-client-note" rows="3" style="width:100%;">${esc(cl.note || '')}</textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:8px;">
          <button class="btn btn-secondary btn-sm" id="save-client-note-btn" data-client-id="${cl.id}">Сохранить заметку</button>
        </div>
      </div>

      <div>
        <div class="form-label" style="margin-bottom:8px;">История (${history.length})</div>
        <div class="upcoming-list">
          ${history.map((b) => {
            const sv = data.services.find((s) => s.id === b.serviceId);
            return `
              <div class="upcoming-item" data-open-booking="${b.id}">
                <div class="upcoming-time tabular-nums">${esc(b.time)}</div>
                <div class="upcoming-info">
                  <div class="upcoming-title">${esc(sv ? sv.name : 'Услуга')}</div>
                  <div class="upcoming-sub">${window.BizViews.formatDateRu(b.date)}</div>
                </div>
                <strong class="tabular-nums">${window.BizStore.formatMoney(b.price)}</strong>
              </div>
            `;
          }).join('') || `<div style="font-size:12.5px; color:var(--text-muted);">Пока нет истории событий</div>`}
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top:auto;" data-book-for-client="${cl.id}">
        ${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}
      </button>
    `);

    const saveBtn = $('save-client-note-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        window.BizStore.updateClientNote(cl.id, $('drawer-client-note').value);
        showToast('Заметка клиента сохранена');
      });
    }
  }

  function openNotificationsDrawer() {
    const state = window.BizStore.getState();
    const esc = window.BizViews.esc;
    openDrawer('Центр событий', 'Уведомления', `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12.5px; color:var(--text-muted);">Лента активности платформы</span>
        <button class="btn btn-ghost btn-sm" id="mark-all-read-btn">Прочитать все</button>
      </div>
      <div class="upcoming-list">
        ${state.notifications.map((n) => `
          <div class="insight-item" style="margin:0;">
            <div class="insight-icon" style="background:${n.unread ? 'var(--accent-soft)' : 'var(--bg-muted)'}; color:${n.unread ? 'var(--accent)' : 'var(--text-muted)'};">
              ${window.BizIcons.svg('bell', 15)}
            </div>
            <div>
              <div class="insight-title">${esc(n.title)}</div>
              <div class="insight-desc">${esc(n.time)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `);

    $('mark-all-read-btn')?.addEventListener('click', () => {
      window.BizStore.markNotificationsRead();
      openNotificationsDrawer();
      showToast('Все уведомления отмечены прочитанными');
    });
  }

  /* ==========================================================================
     Command Palette (Ctrl + K)
     ========================================================================== */

  function openCmdk() {
    $('cmdk-backdrop').classList.remove('hidden');
    $('cmdk-modal').classList.remove('hidden');
    const inp = $('cmdk-input');
    inp.value = '';
    renderCmdkResults('');
    setTimeout(() => inp.focus(), 20);
  }

  function closeCmdk() {
    $('cmdk-backdrop').classList.add('hidden');
    $('cmdk-modal').classList.add('hidden');
  }

  function renderCmdkResults(query) {
    const q = query.trim().toLowerCase();
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const esc = window.BizViews.esc;

    const navItems = [
      { label: 'Главная панель', sub: 'Раздел', view: 'dashboard' },
      { label: 'Календарь и расписание', sub: 'Раздел', view: 'calendar' },
      { label: cfg.terms.bookingsPlural, sub: 'Раздел', view: 'bookings' },
      { label: `CRM: ${cfg.terms.clientsPlural}`, sub: 'Раздел', view: 'clients' },
      { label: 'Услуги и товары', sub: 'Раздел', view: 'catalog' },
      { label: cfg.terms.staffPlural, sub: 'Раздел', view: 'staff' },
      { label: 'Аналитика', sub: 'Раздел', view: 'analytics' },
      { label: 'Настройки и ниши', sub: 'Раздел', view: 'settings' }
    ].filter((x) => !q || x.label.toLowerCase().includes(q));

    const clientMatches = data.clients
      .filter((c) => !q || `${c.name} ${c.phone}`.toLowerCase().includes(q))
      .slice(0, 4);

    const nicheMatches = window.BizNiches.NICHE_ORDER
      .map((id) => window.BizNiches.NICHES[id])
      .filter((n) => !q || n.name.toLowerCase().includes(q));

    let html = '';
    if (navItems.length) {
      html += `<div class="cmdk-group-title">Навигация</div>` + navItems.map((i) => `
        <button class="cmdk-item" data-cmdk-nav="${i.view}">
          <div class="cmdk-item-left"><span class="cmdk-item-title">${esc(i.label)}</span></div>
          <span class="cmdk-item-sub">${esc(i.sub)}</span>
        </button>
      `).join('');
    }
    if (clientMatches.length) {
      html += `<div class="cmdk-group-title">${esc(cfg.terms.clientsPlural)}</div>` + clientMatches.map((c) => `
        <button class="cmdk-item" data-cmdk-client="${c.id}">
          <div class="cmdk-item-left">
            <span class="avatar sm">${esc(window.BizViews.initials(c.name))}</span>
            <div>
              <div class="cmdk-item-title">${esc(c.name)}</div>
              <div class="cmdk-item-sub">${esc(c.phone)}</div>
            </div>
          </div>
          <span class="pill pill-neutral">${esc(c.segment)}</span>
        </button>
      `).join('');
    }
    if (nicheMatches.length) {
      html += `<div class="cmdk-group-title">Переключить нишу</div>` + nicheMatches.map((n) => `
        <button class="cmdk-item" data-cmdk-niche="${n.id}">
          <div class="cmdk-item-left"><span class="cmdk-item-title">${esc(n.name)}</span></div>
          <span class="cmdk-item-sub">${esc(n.defaultBusinessName)}</span>
        </button>
      `).join('');
    }

    $('cmdk-results').innerHTML = html || `<div style="padding:24px; text-align:center; color:var(--text-muted);">Ничего не найдено</div>`;
  }

  function exportCsvReport() {
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const lines = [['Дата', 'Время', cfg.terms.clientSingular, 'Услуга', cfg.terms.staffSingular, 'Сумма', 'Статус'].join(';')];
    data.bookings.forEach((b) => {
      const cl = data.clients.find((c) => c.id === b.clientId);
      const sv = data.services.find((s) => s.id === b.serviceId);
      const st = data.staff.find((s) => s.id === b.staffId);
      lines.push([b.date, b.time, cl?.name || '', sv?.name || '', st?.name || '', b.price, cfg.terms.statusMap[b.status] || b.status].join(';'));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizpilot-${cfg.id}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Отчёт выгружен в CSV');
  }

  function printZReport() {
    const state = window.BizStore.getState();
    const cfg = window.BizStore.getNicheConfig();
    const data = window.BizStore.getCurrentData();
    const esc = window.BizViews.esc;
    const todayIso = window.BizNiches.today;
    const todayBookings = data.bookings.filter((b) => b.date === todayIso);
    const activeBookings = todayBookings.filter((b) => b.status !== 'cancelled');
    const completedBookings = todayBookings.filter((b) => b.status === 'completed');
    const cancelledCount = todayBookings.filter((b) => b.status === 'cancelled').length;
    const totalRevenue = activeBookings.reduce((s, b) => s + (Number(b.price) || 0), 0);
    const completedRevenue = completedBookings.reduce((s, b) => s + (Number(b.price) || 0), 0);
    const avgTicket = activeBookings.length ? Math.round(totalRevenue / activeBookings.length) : 0;

    const byStaff = {};
    activeBookings.forEach((b) => {
      const st = data.staff.find((s) => s.id === b.staffId);
      const name = st ? st.name : 'Не назначен';
      if (!byStaff[name]) byStaff[name] = { count: 0, sum: 0 };
      byStaff[name].count += 1;
      byStaff[name].sum += Number(b.price) || 0;
    });

    const rowsHtml = activeBookings
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((b, i) => {
        const cl = data.clients.find((c) => c.id === b.clientId);
        const sv = data.services.find((s) => s.id === b.serviceId);
        const st = data.staff.find((s) => s.id === b.staffId);
        return `<tr>
          <td>${i + 1}</td>
          <td>${esc(b.time)}</td>
          <td>${esc(cl?.name || 'Клиент')}</td>
          <td>${esc(sv?.name || 'Услуга')}</td>
          <td>${esc(st?.name || '—')}</td>
          <td>${esc(cfg.terms.statusMap[b.status] || b.status)}</td>
          <td style="text-align:right;font-weight:600;">${window.BizStore.formatMoney(b.price)}</td>
        </tr>`;
      }).join('');

    const staffHtml = Object.entries(byStaff).map(([name, info]) => `
      <tr>
        <td>${esc(name)}</td>
        <td style="text-align:center;">${info.count}</td>
        <td style="text-align:right;font-weight:600;">${window.BizStore.formatMoney(info.sum)}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank', 'width=860,height=720');
    if (!win) {
      showToast('Разрешите всплывающие окна для печати Z-отчёта');
      return;
    }
    const nowStr = new Date().toLocaleString('ru-RU');
    win.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Z-отчёт — ${esc(data.businessName || 'BizPilot')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; color: #111827; padding: 32px; max-width: 820px; margin: 0 auto; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
    .hdr h1 { margin: 0 0 4px; font-size: 22px; }
    .hdr .meta { font-size: 13px; color: #4b5563; line-height: 1.5; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
    .kpi-val { font-size: 18px; font-weight: 700; }
    h2 { font-size: 15px; margin: 22px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    .sign { margin-top: 36px; display: flex; justify-content: space-between; font-size: 13px; color: #374151; }
    .print-actions { margin-bottom: 16px; display: flex; gap: 8px; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #d1d5db; background: #111827; color: #fff; cursor: pointer; font-size: 13px; font-weight: 600; }
    @media print { .print-actions { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn" onclick="window.print()">🖨 Печать / Сохранить в PDF</button>
  </div>
  <div class="hdr">
    <div>
      <h1>Z-ОТЧЁТ (Закрытие смены)</h1>
      <div class="meta"><strong>${esc(data.businessName || 'BizPilot')}</strong> · ${esc(cfg.name)}</div>
      ${data.address ? `<div class="meta">Адрес: ${esc(data.address)}</div>` : ''}
    </div>
    <div class="meta" style="text-align:right;">
      <div>Дата смены: <strong>${esc(todayIso)}</strong></div>
      <div>Сформирован: ${esc(nowStr)}</div>
      <div>Ответственный: ${esc(state.ownerName || 'Администратор')}</div>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-lbl">Выручка (план/факт)</div><div class="kpi-val">${window.BizStore.formatMoney(totalRevenue)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Оплачено (завершено)</div><div class="kpi-val">${window.BizStore.formatMoney(completedRevenue)}</div></div>
    <div class="kpi"><div class="kpi-lbl">Визитов / Отмен</div><div class="kpi-val">${activeBookings.length} / ${cancelledCount}</div></div>
    <div class="kpi"><div class="kpi-lbl">Средний чек</div><div class="kpi-val">${window.BizStore.formatMoney(avgTicket)}</div></div>
  </div>
  <h2>Детализация по ${esc(cfg.terms.staffPlural.toLowerCase())}</h2>
  <table>
    <thead><tr><th>Сотрудник</th><th style="text-align:center;">Записей</th><th style="text-align:right;">Сумма</th></tr></thead>
    <tbody>${staffHtml || '<tr><td colspan="3" style="color:#6b7280;">Нет записей за смену</td></tr>'}</tbody>
  </table>
  <h2>Список операций за смену</h2>
  <table>
    <thead><tr><th>#</th><th>Время</th><th>Клиент</th><th>Услуга</th><th>Мастер</th><th>Статус</th><th style="text-align:right;">Сумма</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="7" style="color:#6b7280;">Нет операций за смену</td></tr>'}</tbody>
  </table>
  <div class="sign">
    <div>Смену сдал: _______________________</div>
    <div>Смену принял: _____________________</div>
  </div>
</body>
</html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
    showToast('Z-отчёт сформирован для печати / PDF');
  }

  /* ==========================================================================
     Global Event Delegation
     ========================================================================== */

  function initEvents() {
    // Niche dropdown toggle
    $('niche-switcher-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = $('niche-dropdown');
      const open = dd.classList.toggle('hidden');
      $('niche-switcher-btn').setAttribute('aria-expanded', String(!open));
    });

    document.addEventListener('click', (e) => {
      const target = e.target;

      // Close niche dropdown when clicking outside
      if (!target.closest('.niche-switcher-wrap')) {
        $('niche-dropdown').classList.add('hidden');
      }

      const navBtn = target.closest('[data-nav]');
      if (navBtn) {
        window.BizStore.setView(navBtn.dataset.nav);
        $('sidebar').classList.remove('mobile-open');
        $('mobile-backdrop').classList.add('hidden');
        return;
      }

      const nicheBtn = target.closest('[data-select-niche]');
      if (nicheBtn) {
        const nicheId = nicheBtn.dataset.selectNiche;
        window.BizStore.setNiche(nicheId);
        $('niche-dropdown').classList.add('hidden');
        showToast(`Режим переключён: ${window.BizNiches.NICHES[nicheId].name}`);
        return;
      }

      const revBtn = target.closest('[data-rev-range]');
      if (revBtn) {
        window.BizStore.setRevenueRange(revBtn.dataset.revRange);
        return;
      }

      const calModeBtn = target.closest('[data-cal-mode]');
      if (calModeBtn) {
        window.BizStore.setCalendarMode(calModeBtn.dataset.calMode);
        return;
      }

      const bkStatusFilter = target.closest('[data-booking-status-filter]');
      if (bkStatusFilter) {
        window.BizUiFilters.bookingsStatus = bkStatusFilter.dataset.bookingStatusFilter;
        renderView();
        return;
      }

      const clSegBtn = target.closest('[data-client-segment]');
      if (clSegBtn) {
        window.BizUiFilters.clientsSegment = clSegBtn.dataset.clientSegment;
        renderView();
        return;
      }

      const catTabBtn = target.closest('[data-catalog-tab]');
      if (catTabBtn) {
        window.BizUiFilters.catalogTab = catTabBtn.dataset.catalogTab;
        renderView();
        return;
      }

      const openBk = target.closest('[data-open-booking]');
      if (openBk) {
        openBookingDrawer(openBk.dataset.openBooking);
        return;
      }

      const openCl = target.closest('[data-open-client]');
      if (openCl && openCl.dataset.openClient) {
        openClientDrawer(openCl.dataset.openClient);
        return;
      }

      const slotCell = target.closest('[data-quick-slot-time]');
      if (slotCell) {
        openCreateBookingModal({
          staffId: slotCell.dataset.quickSlotStaff,
          time: slotCell.dataset.quickSlotTime,
          date: slotCell.dataset.quickSlotDate
        });
        return;
      }

      const restockBtn = target.closest('[data-restock-id]');
      if (restockBtn) {
        window.BizStore.restockProduct(restockBtn.dataset.restockId, 5);
        showToast('Остаток пополнен (+5 шт)');
        return;
      }

      const bookSvcBtn = target.closest('[data-book-service]');
      if (bookSvcBtn) {
        openCreateBookingModal({ serviceId: bookSvcBtn.dataset.bookService });
        return;
      }

      const bookClientBtn = target.closest('[data-book-for-client]');
      if (bookClientBtn) {
        closeDrawer();
        openCreateBookingModal({ clientId: bookClientBtn.dataset.bookForClient });
        return;
      }

      const setStatusBtn = target.closest('[data-set-booking-status]');
      if (setStatusBtn) {
        window.BizStore.updateBookingStatus(setStatusBtn.dataset.bookingId, setStatusBtn.dataset.setBookingStatus);
        openBookingDrawer(setStatusBtn.dataset.bookingId);
        showToast('Статус обновлён');
        return;
      }

      const delBkBtn = target.closest('[data-delete-booking]');
      if (delBkBtn) {
        window.BizStore.deleteBooking(delBkBtn.dataset.deleteBooking);
        closeDrawer();
        showToast('Событие удалено');
        return;
      }

      const actionBtn = target.closest('[data-action]');
      if (actionBtn) {
        const act = actionBtn.dataset.action;
        if (act === 'open-booking-modal') openCreateBookingModal();
        if (act === 'open-client-modal') openCreateClientModal();
        if (act === 'open-service-modal') openCreateServiceModal();
        if (act === 'open-staff-modal') openCreateStaffModal();
        if (act === 'export-report') exportCsvReport();
        if (act === 'print-z-report') printZReport();
        if (act === 'open-billing-modal') openBillingModal();
        if (act === 'reset-demo') {
          window.BizStore.resetDemoData();
          showToast('Демо-данные загружены');
        }
        if (act === 'clear-demo') {
          window.BizStore.clearDemoData();
          if (window.BizOnboarding) window.BizOnboarding.showOnboarding();
          showToast('Демо-данные очищены');
        }
        return;
      }

      if (target.closest('[data-close-modal]')) {
        closeModal();
        return;
      }

      const cmdkNav = target.closest('[data-cmdk-nav]');
      if (cmdkNav) {
        window.BizStore.setView(cmdkNav.dataset.cmdkNav);
        closeCmdk();
        return;
      }

      const cmdkClient = target.closest('[data-cmdk-client]');
      if (cmdkClient) {
        closeCmdk();
        openClientDrawer(cmdkClient.dataset.cmdkClient);
        return;
      }

      const cmdkNiche = target.closest('[data-cmdk-niche]');
      if (cmdkNiche) {
        window.BizStore.setNiche(cmdkNiche.dataset.cmdkNiche);
        closeCmdk();
        showToast('Ниша переключена');
        return;
      }

      // Save booking slug
      if (target.id === 'save-slug-btn' || target.closest('#save-slug-btn')) {
        const input = document.getElementById('booking-slug-input');
        const slug = (input?.value || '').trim().toLowerCase();
        if (!slug || !/^[a-z0-9\-]{3,40}$/.test(slug)) {
          showToast('Slug: 3-40 символов, только латиница, цифры и дефис');
          return;
        }
        const authUser = window.BizStore.getAuthUser?.();
        if (authUser) {
          window.BizStore.apiFetch('/api/workspace/slug', {
            method: 'PUT',
            body: JSON.stringify({ slug })
          }).then(() => {
            window.BizStore.updateGlobalSettings({ settings: { bookingSlug: slug } });
            showToast(`Slug сохранён: /book/${slug}`);
          }).catch(err => showToast('Ошибка: ' + (err.message || 'Slug уже занят')));
        } else {
          window.BizStore.updateGlobalSettings({ settings: { bookingSlug: slug } });
          showToast(`Slug сохранён локально: /book/${slug} (войдите для сохранения в БД)`);
        }
        return;
      }

      // Copy booking link
      if (target.id === 'copy-booking-link-btn' || target.closest('#copy-booking-link-btn')) {
        const slug = window.BizStore.getState().settings?.bookingSlug;
        if (slug) {
          navigator.clipboard.writeText(`${location.origin}/book/${slug}`)
            .then(() => showToast('Ссылка скопирована в буфер'))
            .catch(() => showToast(`Ссылка: /book/${slug}`));
        }
        return;
      }
    });

    document.addEventListener('change', (e) => {
      const svcToggle = e.target.closest('[data-toggle-service]');
      if (svcToggle) {
        window.BizStore.toggleServiceActive(svcToggle.dataset.toggleService);
        showToast('Статус позиции обновлён');
      }

      const setToggle = e.target.closest('[data-setting-toggle]');
      if (setToggle) {
        const key = setToggle.dataset.settingToggle;
        window.BizStore.updateGlobalSettings({ settings: { [key]: setToggle.checked } });
        showToast('Настройка сохранена');
      }
    });

    // Chrome buttons
    $('sidebar-collapse-btn').addEventListener('click', () => window.BizStore.toggleSidebar());
    $('theme-toggle-btn').addEventListener('click', () => window.BizStore.toggleTheme());
    $('quick-create-btn').addEventListener('click', () => openCreateBookingModal());
    $('auth-btn')?.addEventListener('click', () => openAuthModal());
    $('clear-demo-btn')?.addEventListener('click', () => {
      window.BizStore.clearDemoData();
      if (window.BizOnboarding) window.BizOnboarding.showOnboarding();
      showToast('Демо-данные убраны — настройте свой бизнес');
    });
    $('notifications-btn').addEventListener('click', () => openNotificationsDrawer());
    $('drawer-close-btn').addEventListener('click', closeDrawer);
    $('drawer-backdrop').addEventListener('click', closeDrawer);
    $('modal-close-btn').addEventListener('click', closeModal);
    $('modal-backdrop').addEventListener('click', closeModal);

    // Mobile drawer menu
    $('mobile-menu-btn').addEventListener('click', () => {
      $('sidebar').classList.add('mobile-open');
      $('mobile-backdrop').classList.remove('hidden');
    });
    $('mobile-backdrop').addEventListener('click', () => {
      $('sidebar').classList.remove('mobile-open');
      $('mobile-backdrop').classList.add('hidden');
    });

    // Command Palette
    $('command-palette-trigger').addEventListener('click', openCmdk);
    $('cmdk-backdrop').addEventListener('click', closeCmdk);
    $('cmdk-input').addEventListener('input', (e) => renderCmdkResults(e.target.value));

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCmdk();
      } else if (e.key === 'Escape') {
        closeCmdk();
        closeModal();
        closeDrawer();
      }
    });
  }

  function openAuthModal(mode = 'login') {
    const authUser = window.BizStore.getAuthUser();
    const esc = window.BizViews.esc;

    if (authUser) {
      openModal('Аккаунт BizPilot', `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div class="avatar lg">${esc(window.BizViews.initials(authUser.name))}</div>
            <div>
              <div style="font-weight:700; font-size:16px;">${esc(authUser.name)}</div>
              <div style="font-size:13px; color:var(--text-secondary);">${esc(authUser.email)}</div>
              <span class="pill pill-success" style="margin-top:6px;">Синхронизация с БД активна</span>
            </div>
          </div>
          <div class="modal-footer" style="margin-top:8px;">
            <button type="button" class="btn btn-secondary" id="open-billing-from-auth">Тариф и подписка</button>
            <button type="button" class="btn btn-danger" id="auth-logout-btn">Выйти из аккаунта</button>
          </div>
        </div>
      `);
      $('open-billing-from-auth')?.addEventListener('click', () => openBillingModal());
      $('auth-logout-btn')?.addEventListener('click', () => {
        window.BizStore.logout();
        closeModal();
        showToast('Вы вышли из аккаунта');
      });
      return;
    }

    if (mode === 'forgot') {
      openModal('Восстановление пароля', `
        <form id="forgot-form">
          <div class="form-grid">
            <div class="form-field full">
              <label class="form-label">Email аккаунта</label>
              <input class="input" type="email" name="email" placeholder="owner@company.ru" required>
            </div>
          </div>
          <div id="auth-error" style="color:var(--danger); font-size:12.5px; margin-top:10px; display:none;"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="back-to-login-btn">Назад ко входу</button>
            <button type="submit" class="btn btn-primary">Отправить код</button>
          </div>
        </form>
      `);
      $('back-to-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      $('forgot-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (new FormData(e.target).get('email') || '').toString().trim();
        const errEl = $('auth-error');
        try {
          const res = await window.BizStore.apiFetch('/api/auth/forgot', {
            method: 'POST',
            body: JSON.stringify({ email })
          });
          if (res.dev_code) showToast(`Код (dev): ${res.dev_code}`);
          else showToast('Код отправлен на email');
          openResetCodeModal(email, res.dev_code || '');
        } catch (err) {
          errEl.textContent = err.message || 'Ошибка';
          errEl.style.display = 'block';
        }
      });
      return;
    }

    const isReg = mode === 'register';
    openModal(isReg ? 'Регистрация в BizPilot' : 'Вход в BizPilot', `
      <div class="segmented" style="margin-bottom:16px; width:100%;">
        <button type="button" class="segmented-btn ${!isReg ? 'active' : ''}" id="auth-tab-login" style="flex:1;">Вход</button>
        <button type="button" class="segmented-btn ${isReg ? 'active' : ''}" id="auth-tab-reg" style="flex:1;">Регистрация</button>
      </div>
      <form id="auth-form">
        <div class="form-grid">
          ${isReg ? `
            <div class="form-field full">
              <label class="form-label">Ваше имя</label>
              <input class="input" name="name" placeholder="Алексей Кузнецов" required>
            </div>
          ` : ''}
          <div class="form-field full">
            <label class="form-label">Email</label>
            <input class="input" type="email" name="email" placeholder="owner@company.ru" required>
          </div>
          <div class="form-field full">
            <label class="form-label">Пароль</label>
            <input class="input" type="password" name="password" placeholder="Минимум 6 символов" minlength="6" required>
          </div>
        </div>
        ${!isReg ? '<div style="margin-top:8px;"><button type="button" class="btn-link" id="auth-forgot-link" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12.5px;padding:0;">Забыли пароль?</button></div>' : ''}
        <div id="auth-error" style="color:var(--danger); font-size:12.5px; margin-top:10px; display:none;"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">${isReg ? 'Создать аккаунт' : 'Войти'}</button>
        </div>
      </form>
    `);

    $('auth-tab-login')?.addEventListener('click', () => openAuthModal('login'));
    $('auth-tab-reg')?.addEventListener('click', () => openAuthModal('register'));
    $('auth-forgot-link')?.addEventListener('click', () => openAuthModal('forgot'));

    $('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = $('auth-error');
      errEl.style.display = 'none';
      try {
        if (isReg) {
          await window.BizStore.register(fd.get('name'), fd.get('email'), fd.get('password'));
          showToast('Аккаунт создан и подключён к БД');
        } else {
          await window.BizStore.login(fd.get('email'), fd.get('password'));
          showToast('Вход выполнен, данные загружены из БД');
        }
        closeModal();
      } catch (err) {
        errEl.textContent = err.message || 'Ошибка авторизации';
        errEl.style.display = 'block';
      }
    });
  }

  function openResetCodeModal(email, prefillCode = '') {
    const esc = window.BizViews.esc;
    openModal('Новый пароль', `
      <form id="reset-code-form">
        <div class="form-grid">
          <div class="form-field full">
            <label class="form-label">Код из письма (${esc(email)})</label>
            <input class="input" name="code" value="${esc(prefillCode)}" placeholder="6-значный код" required>
          </div>
          <div class="form-field full">
            <label class="form-label">Новый пароль</label>
            <input class="input" type="password" name="new_password" minlength="6" placeholder="Минимум 6 символов" required>
          </div>
        </div>
        <div id="auth-error" style="color:var(--danger); font-size:12.5px; margin-top:10px; display:none;"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          <button type="submit" class="btn btn-primary">Сменить пароль</button>
        </div>
      </form>
    `);
    $('reset-code-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = $('auth-error');
      try {
        await window.BizStore.apiFetch('/api/auth/reset', {
          method: 'POST',
          body: JSON.stringify({
            email,
            code: fd.get('code'),
            new_password: fd.get('new_password')
          })
        });
        showToast('Пароль изменён, войдите с новым паролем');
        openAuthModal('login');
      } catch (err) {
        errEl.textContent = err.message || 'Ошибка';
        errEl.style.display = 'block';
      }
    });
  }

  async function openBillingModal() {
    const esc = window.BizViews.esc;
    openModal('Ранний доступ BizPilot (Бета)', '<div style="padding:24px;text-align:center;color:var(--text-muted);">Загрузка...</div>');
    try {
      const info = await window.BizStore.apiFetch('/api/billing/plans');
      const authUser = window.BizStore.getAuthUser();
      const cur = info.current_plan || 'trial';
      const cards = (info.plans || []).filter((p) => p.id !== 'trial').map((p) => `
        <div class="card" style="padding:16px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:15px;">${esc(p.name)}</strong>
              <span class="pill pill-success">Открыто в бете</span>
            </div>
            <ul style="font-size:12.5px; color:var(--text-secondary); padding-left:16px; margin:10px 0 0; display:flex; flex-direction:column; gap:4px;">
              ${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('');

      $('modal-body').innerHTML = `
        <div style="margin-bottom:14px; padding:12px 14px; background:var(--accent-soft); border-radius:10px; font-size:13px; color:var(--text-primary); display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <span>Сейчас действует <strong>бесплатный ранний доступ (${esc(cur.toUpperCase())})</strong> — все модули включены.</span>
          <span>Сотрудников: <strong>${info.usage?.staff || 0}</strong> · Записей: <strong>${info.usage?.bookings || 0}</strong></span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:18px;">
          ${cards}
        </div>
        <form id="plan-request-form" style="border-top:1px solid var(--border); padding-top:14px;">
          <div style="font-weight:600; font-size:13.5px; margin-bottom:8px;">Нужна помощь с настройкой или подключение на команду?</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Телефон / WhatsApp / Telegram</label>
              <input class="input" name="contact" placeholder="+7 777 000-00-00 или @username" value="${esc(authUser?.email || '')}" required>
            </div>
            <div class="form-field">
              <label class="form-label">Комментарий</label>
              <input class="input" name="comment" placeholder="Количество филиалов / мастеров">
            </div>
          </div>
          <div class="modal-footer" style="margin-top:12px;">
            <button type="button" class="btn btn-secondary" data-close-modal>Закрыть</button>
            <button type="submit" class="btn btn-primary">Оставить заявку</button>
          </div>
        </form>
      `;

      $('plan-request-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await window.BizStore.apiFetch('/api/billing/request', {
            method: 'POST',
            body: JSON.stringify({
              plan_id: 'beta-pro',
              contact: fd.get('contact'),
              comment: fd.get('comment')
            })
          });
          showToast('Заявка отправлена! Мы свяжемся с вами.');
          closeModal();
        } catch (err) {
          showToast('Ошибка: ' + err.message);
        }
      });
    } catch (err) {
      $('modal-body').innerHTML = `<div style="color:var(--danger);padding:16px;">Ошибка загрузки: ${esc(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.BizStore.subscribe(renderView);
    initEvents();
    renderView();
    window.BizStore.hydrateFromServer();
    if (!window.BizStore.getState().onboardingDone && window.BizOnboarding) {
      window.BizOnboarding.showOnboarding();
    }

    // Register Service Worker for PWA / offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('[PWA] Service Worker registered, scope:', reg.scope);
          // Check for updates every hour
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    }

    // Handle PWA shortcut: ?action=new-booking, ?view=crm etc.
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new-booking') {
      setTimeout(() => document.getElementById('fab-new-booking')?.click(), 500);
    }
    if (params.get('view')) {
      const targetView = params.get('view');
      setTimeout(() => {
        const link = document.querySelector(`[data-view="${targetView}"]`);
        if (link) link.click();
      }, 300);
    }
  });
})();
