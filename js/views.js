(function () {
  const esc = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function initials(name) {
    return (name || 'BP')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  function statusPill(status, nicheCfg) {
    const label = nicheCfg.terms.statusMap[status] || status;
    const map = {
      confirmed: 'pill-accent',
      pending: 'pill-info',
      in_progress: 'pill-warning',
      completed: 'pill-success',
      cancelled: 'pill-danger'
    };
    return `<span class="pill ${map[status] || 'pill-neutral'}"><span class="pill-dot"></span>${esc(label)}</span>`;
  }

  function formatDateRu(iso) {
    if (!iso) return '—';
    if (iso === window.BizNiches.today) return 'Сегодня';
    if (iso === window.BizNiches.tomorrow) return 'Завтра';
    if (iso === window.BizNiches.yesterday) return 'Вчера';
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  function timeToMinutes(t) {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return (h || 9) * 60 + (m || 0);
  }

  function buildRevenueSeries(range, baseDaily) {
    const counts = { '7d': 7, '30d': 14, '90d': 12 };
    const n = counts[range] || 7;
    const pts = [];
    const base = baseDaily || 65000;
    const factors = [0.76, 0.84, 0.81, 0.92, 0.88, 1.05, 1.0, 0.94, 1.08, 1.14, 1.02, 1.18, 1.11, 1.22];
    for (let i = 0; i < n; i++) {
      const f = factors[i % factors.length];
      let label = '';
      if (range === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i));
        label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
      } else if (range === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i) * 2);
        label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      } else {
        label = `Нед ${i + 1}`;
      }
      const val = Math.round(base * f * (range === '90d' ? 6.4 : 1));
      const cnt = Math.max(4, Math.round((val / 3200)));
      pts.push({ label, value: val, count: cnt });
    }
    return pts;
  }

  /* --------------------------------------------------------------------------
     1. DASHBOARD VIEW
     -------------------------------------------------------------------------- */
  function renderDashboard(state, cfg, data) {
    const todayBookings = data.bookings
      .filter((b) => b.date === window.BizNiches.today)
      .sort((a, b) => a.time.localeCompare(b.time));

    const revenueToday = todayBookings
      .filter((b) => b.status === 'completed')
      .reduce((acc, b) => acc + Number(b.price || 0), 0);

    const totalClients = data.clients.length;
    const avgTicket = data.bookings.length
      ? Math.round(data.bookings.reduce((s, b) => s + Number(b.price || 0), 0) / data.bookings.length)
      : 0;
    const confirmedToday = todayBookings.filter((b) => b.status !== 'cancelled').length;
    const totalSlots = data.staff.length * 10 || 10;
    const loadPct = totalSlots ? Math.min(100, Math.round((confirmedToday / totalSlots) * 100)) : 0;

    // First-run welcome banner when no data yet
    const isEmpty = !data.staff.length && !data.clients.length && !data.bookings.length;

    const welcomeBanner = isEmpty ? `
      <div class="welcome-banner">
        <div>
          <h2 class="welcome-banner-title">Добро пожаловать в BizPilot, ${esc(state.ownerName || 'Владелец')}! 👋</h2>
          <p class="welcome-banner-sub">Начните с добавления сотрудников, услуг и первого клиента — и ваша панель оживёт.</p>
        </div>
        <div class="welcome-banner-actions">
          <button class="btn btn-white" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} Первая запись</button>
          <button class="btn btn-white-ghost" data-nav="staff">${window.BizIcons.svg('staff', 15)} Добавить команду</button>
        </div>
      </div>
    ` : '';

    // Live KPI cards
    const kpiCards = [
      {
        label: 'Выручка сегодня',
        value: window.BizStore.formatMoney(revenueToday),
        icon: 'wallet',
        sub: `${todayBookings.filter((b) => b.status === 'completed').length} завершённых`,
        color: 'var(--success)'
      },
      {
        label: 'Записей на сегодня',
        value: `${confirmedToday}`,
        icon: 'calendar',
        sub: data.staff.length ? `${loadPct}% загрузка` : 'Добавьте сотрудников',
        color: 'var(--accent)'
      },
      {
        label: 'Клиентская база',
        value: `${totalClients}`,
        icon: 'clients',
        sub: totalClients ? `${data.clients.filter((c) => c.segment === 'VIP').length} VIP` : 'Пока пусто',
        color: 'var(--info)'
      },
      {
        label: 'Средний чек',
        value: avgTicket ? window.BizStore.formatMoney(avgTicket) : '—',
        icon: 'trending',
        sub: data.bookings.length ? `По ${data.bookings.length} событиям` : 'Нет данных',
        color: 'var(--warning)'
      }
    ].map((k) => `
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">${esc(k.label)}</span>
          <span class="kpi-icon" style="background:color-mix(in srgb, ${k.color} 14%, transparent); color:${k.color};">${window.BizIcons.svg(k.icon, 16)}</span>
        </div>
        <div class="kpi-value tabular-nums" style="margin-top:8px;">${esc(k.value)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${esc(k.sub)}</div>
      </div>
    `).join('');

    const upcomingHtml = todayBookings.length
      ? todayBookings.map((b) => {
          const client = data.clients.find((c) => c.id === b.clientId);
          const staff = data.staff.find((s) => s.id === b.staffId);
          const svc = data.services.find((s) => s.id === b.serviceId);
          return `
            <div class="upcoming-item" data-open-booking="${b.id}">
              <div class="upcoming-time tabular-nums">${esc(b.time)}</div>
              <div class="upcoming-info">
                <div class="upcoming-title">${esc(client ? client.name : 'Гость')} — ${esc(svc ? svc.name : 'Услуга')}</div>
                <div class="upcoming-sub">${esc(staff ? staff.name : '')} • ${esc(b.extra || b.channel)}</div>
              </div>
              <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                <span class="tabular-nums" style="font-weight:700; font-size:12.5px;">${window.BizStore.formatMoney(b.price)}</span>
                ${statusPill(b.status, cfg)}
              </div>
            </div>
          `;
        }).join('')
      : `
          <div class="empty-state" style="padding:28px 16px;">
            ${window.BizIcons.svg('calendar', 28)}
            <div style="color:var(--text-muted); font-size:13px; text-align:center;">На сегодня нет записей.<br>Нажмите «${esc(cfg.terms.createBooking)}»</div>
            <button class="btn btn-secondary btn-sm" data-action="open-booking-modal">${window.BizIcons.svg('plus', 14)} Создать</button>
          </div>
        `;

    const topServices = data.services.filter((s) => s.active).slice(0, 4);
    const topServicesHtml = topServices.length
      ? topServices.map((s) => {
          const pct = s.popular || 65;
          return `
            <div>
              <div class="metric-row-head">
                <span style="font-weight:500;">${esc(s.name)}</span>
                <span class="tabular-nums" style="font-weight:600;">${s.price === 0 ? 'Бесплатно' : window.BizStore.formatMoney(s.price)}</span>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>
          `;
        }).join('')
      : `<div class="empty-state" style="padding:20px;"><div style="color:var(--text-muted); font-size:13px; text-align:center;">Нет позиций в каталоге</div><button class="btn btn-secondary btn-sm" data-nav="catalog">Добавить</button></div>`;

    const teamLoad = data.staff.length
      ? data.staff.slice(0, 4).map((st) => `
          <div>
            <div class="metric-row-head">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="avatar sm">${esc(initials(st.name))}</span>
                <div>
                  <div style="font-weight:600; font-size:13px;">${esc(st.name)}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${esc(st.role)}</div>
                </div>
              </div>
              <span class="tabular-nums" style="font-weight:700;">${st.busy}%</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${st.busy}%"></div></div>
          </div>
        `).join('')
      : `<div class="empty-state" style="padding:20px;"><div style="color:var(--text-muted); font-size:13px; text-align:center;">Команда ещё не добавлена</div><button class="btn btn-secondary btn-sm" data-nav="staff">Добавить</button></div>`;

    const activeInsights = isEmpty ? [
      { type: 'accent', title: 'Шаг 1: Добавьте команду', desc: `Внесите специалистов (${cfg.terms.staffPlural.toLowerCase()}), чтобы открылась сетка календаря.` },
      { type: 'success', title: 'Шаг 2: Наполните каталог', desc: `Добавьте ${cfg.terms.serviceTab.toLowerCase()} и цены для быстрого оформления.` },
      { type: 'warning', title: 'Шаг 3: Создайте первую запись', desc: 'После завершения события начнёт строиться график выручки.' }
    ] : cfg.insights;

    const insightsHtml = activeInsights.map((ins) => {
      const tone = ins.type === 'warning' ? 'background:var(--warning-soft); color:var(--warning);'
        : ins.type === 'success' ? 'background:var(--success-soft); color:var(--success);'
        : 'background:var(--accent-soft); color:var(--accent);';
      return `
        <div class="insight-item">
          <div class="insight-icon" style="${tone}">${window.BizIcons.svg('sparkles', 15)}</div>
          <div>
            <div class="insight-title">${esc(ins.title)}</div>
            <div class="insight-desc">${esc(ins.desc)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Revenue chart — only show if there are bookings
    const series = buildRevenueSeries(state.revenueRange, Math.max(revenueToday * 7, 15000));
    const revenueSection = data.bookings.length ? `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Динамика выручки</h3>
            <div class="card-subtitle">Наведите на точку для детализации</div>
          </div>
          <div class="segmented">
            <button class="segmented-btn ${state.revenueRange === '7d' ? 'active' : ''}" data-rev-range="7d">7 дней</button>
            <button class="segmented-btn ${state.revenueRange === '30d' ? 'active' : ''}" data-rev-range="30d">30 дней</button>
            <button class="segmented-btn ${state.revenueRange === '90d' ? 'active' : ''}" data-rev-range="90d">Квартал</button>
          </div>
        </div>
        <div class="card-body">
          ${window.BizCharts.revenueAreaChart(series, state.currency)}
        </div>
      </div>
    ` : `
      <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:260px;">
        <div class="empty-state">
          <div class="empty-state-icon">${window.BizIcons.svg('analytics', 28)}</div>
          <h3 class="empty-state-title">График появится здесь</h3>
          <p class="empty-state-desc">Создайте первую запись и завершите её — данные по выручке начнут накапливаться</p>
          <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
        </div>
      </div>
    `;

    return `
      ${welcomeBanner}

      <div class="view-header">
        <div>
          <h2 class="view-heading">${esc(data.businessName || 'Главная панель')}</h2>
          <p class="view-subheading">${esc(cfg.tagline)}</p>
        </div>
        <div class="toolbar-group">
          ${data.bookings.length ? `<button class="btn btn-secondary" data-action="export-report">${window.BizIcons.svg('download', 15)} Экспорт</button>` : ''}
          <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
        </div>
      </div>

      <section class="kpi-grid">${kpiCards}</section>

      <section class="dashboard-grid">
        ${revenueSection}
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Расписание на сегодня</h3>
              <div class="card-subtitle">${todayBookings.length} событий</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-nav="calendar">Календарь</button>
          </div>
          <div class="card-body" style="padding:14px 16px;">
            <div class="upcoming-list">${upcomingHtml}</div>
          </div>
        </div>
      </section>

      <section class="dashboard-bottom-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Популярные позиции</h3>
            <button class="btn btn-ghost btn-sm" data-nav="catalog">Каталог</button>
          </div>
          <div class="card-body">
            <div class="metric-list">${topServicesHtml}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Загрузка: ${esc(cfg.terms.staffPlural)}</h3>
            <button class="btn btn-ghost btn-sm" data-nav="staff">Команда</button>
          </div>
          <div class="card-body">
            <div class="metric-list">${teamLoad}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Рекомендации</h3>
            <span class="pill pill-accent">Советы</span>
          </div>
          <div class="card-body">${insightsHtml}</div>
        </div>
      </section>
    `;
  }

  /* --------------------------------------------------------------------------
     2. CALENDAR VIEW
     -------------------------------------------------------------------------- */
  function renderCalendar(state, cfg, data) {
    const startHour = 9;
    const endHour = 21;
    const hours = [];
    for (let h = startHour; h <= endHour; h++) hours.push(h);

    const activeDate = state.calendarDate || window.BizNiches.today;
    const dayBookings = data.bookings.filter((b) => b.date === activeDate);

    let gridBodyHtml = '';
    if (state.calendarMode === 'week') {
      const baseDate = new Date(`${activeDate}T12:00:00`);
      const dayOfWeek = (baseDate.getDay() + 6) % 7;
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() - dayOfWeek);

      const cols = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const isToday = iso === window.BizNiches.today;
        const list = data.bookings
          .filter((b) => b.date === iso)
          .sort((a, b) => a.time.localeCompare(b.time));

        cols.push(`
          <div class="week-day-col">
            <div class="week-day-head ${isToday ? 'today' : ''}">
              <span style="font-weight:700; font-size:13px;">${d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</span>
              <span class="pill ${isToday ? 'pill-accent' : 'pill-neutral'}">${list.length}</span>
            </div>
            <div class="week-day-body">
              ${list.map((b) => {
                const cl = data.clients.find((c) => c.id === b.clientId);
                const sv = data.services.find((s) => s.id === b.serviceId);
                return `
                  <div class="week-event-card" data-open-booking="${b.id}">
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-bottom:2px;">
                      <strong style="color:var(--text-primary);">${esc(b.time)}</strong>
                      <span>${window.BizStore.formatMoney(b.price)}</span>
                    </div>
                    <div style="font-weight:600; font-size:12.5px;">${esc(cl ? cl.name : 'Гость')}</div>
                    <div style="font-size:11.5px; color:var(--text-secondary);">${esc(sv ? sv.name : '')}</div>
                  </div>
                `;
              }).join('') || `<div style="font-size:12px; color:var(--text-muted); padding:16px 4px; text-align:center;">Нет записей</div>`}
              <button class="btn btn-ghost btn-sm" style="margin-top:auto;" data-quick-slot-date="${iso}" data-quick-slot-time="12:00">+ Добавить</button>
            </div>
          </div>
        `);
      }
      gridBodyHtml = `<div class="calendar-grid-scroll"><div class="week-grid">${cols.join('')}</div></div>`;
    } else {
      const resources = data.staff;
      const colTemplate = `68px repeat(${resources.length}, minmax(185px, 1fr))`;

      const headerRow = `
        <div class="cal-corner">Время</div>
        ${resources.map((st) => `
          <div class="cal-col-header">
            <div class="avatar sm">${esc(initials(st.name))}</div>
            <div style="min-width:0;">
              <div style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(st.name)}</div>
              <div style="font-size:11px; color:var(--text-muted);">${esc(st.role)} • ${st.busy}%</div>
            </div>
          </div>
        `).join('')}
      `;

      const timeCells = hours.map((h) => `<div class="cal-time-slot tabular-nums">${String(h).padStart(2, '0')}:00</div>`).join('');

      const nowMinutes = 13 * 60 + 20;
      const slotH = 76;
      const nowOffsetPx = ((nowMinutes - startHour * 60) / 60) * slotH;

      const resourceCols = resources.map((st) => {
        const events = dayBookings.filter((b) => b.staffId === st.id);
        const slotsHtml = hours.map((h) => {
          const tStr = `${String(h).padStart(2, '0')}:00`;
          return `<div class="cal-slot-cell" title="Нажмите, чтобы создать: ${tStr}" data-quick-slot-staff="${st.id}" data-quick-slot-time="${tStr}" data-quick-slot-date="${activeDate}"></div>`;
        }).join('');

        const eventsHtml = events.map((b) => {
          const cl = data.clients.find((c) => c.id === b.clientId);
          const sv = data.services.find((s) => s.id === b.serviceId);
          const startMin = Math.max(startHour * 60, timeToMinutes(b.time));
          const topPx = ((startMin - startHour * 60) / 60) * slotH + 2;
          const heightPx = Math.max(42, ((b.duration || 60) / 60) * slotH - 4);
          return `
            <div class="cal-event status-${b.status}" style="top:${topPx}px; height:${heightPx}px;" data-open-booking="${b.id}">
              <div class="cal-event-time tabular-nums">${esc(b.time)} • ${b.duration || 60} мин</div>
              <div class="cal-event-title">${esc(cl ? cl.name : 'Гость')}</div>
              <div class="cal-event-sub">${esc(sv ? sv.name : '')}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="cal-resource-col">
            ${slotsHtml}
            ${activeDate === window.BizNiches.today ? `<div class="cal-now-line" style="top:${nowOffsetPx}px;"></div>` : ''}
            ${eventsHtml}
          </div>
        `;
      }).join('');

      gridBodyHtml = data.staff.length ? `
        <div class="calendar-grid-scroll">
          <div class="cal-resource-grid" style="grid-template-columns:${colTemplate};">
            ${headerRow}
            <div class="cal-time-col">${timeCells}</div>
            ${resourceCols}
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">${window.BizIcons.svg('calendar', 28)}</div>
          <h3 class="empty-state-title">Нет ресурсов для сетки</h3>
          <p class="empty-state-desc">Добавьте сотрудников (${esc(cfg.terms.staffPlural.toLowerCase())}), чтобы планировать расписание по колонкам</p>
          <button class="btn btn-primary" data-action="open-staff-modal">${window.BizIcons.svg('plus', 15)} Добавить сотрудника</button>
        </div>
      `;
    }

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">Календарь: ${esc(cfg.terms.resourceCol)}</h2>
          <p class="view-subheading">Нажмите на свободный час, чтобы мгновенно создать ${esc(cfg.terms.bookingSingular.toLowerCase())}</p>
        </div>
        <div class="toolbar-group">
          <div class="segmented">
            <button class="segmented-btn ${state.calendarMode === 'day' ? 'active' : ''}" data-cal-mode="day">День (сетка)</button>
            <button class="segmented-btn ${state.calendarMode === 'week' ? 'active' : ''}" data-cal-mode="week">Неделя</button>
          </div>
          <input type="date" class="input" id="calendar-date-picker" value="${esc(activeDate)}">
          <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
        </div>
      </div>

      <div class="calendar-shell">
        ${gridBodyHtml}
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     3. BOOKINGS LIST VIEW
     -------------------------------------------------------------------------- */
  function renderBookings(state, cfg, data) {
    const search = (window.BizUiFilters?.bookingsSearch || '').toLowerCase();
    const statusFilter = window.BizUiFilters?.bookingsStatus || 'all';

    const rows = data.bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!search) return true;
      const cl = data.clients.find((c) => c.id === b.clientId);
      const st = data.staff.find((s) => s.id === b.staffId);
      const sv = data.services.find((s) => s.id === b.serviceId);
      const blob = `${cl?.name || ''} ${st?.name || ''} ${sv?.name || ''} ${b.extra || ''}`.toLowerCase();
      return blob.includes(search);
    });

    const statuses = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">${esc(cfg.terms.bookingsPlural)}</h2>
          <p class="view-subheading">Полный журнал событий, управление статусами и быстрой оплатой</p>
        </div>
        <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
      </div>

      <div class="toolbar">
        <div class="toolbar-group">
          <div class="input-wrap">
            <span class="input-icon">${window.BizIcons.svg('search', 15)}</span>
            <input class="input with-icon" id="bookings-search-input" type="text" placeholder="Поиск по клиенту, услуге, заметке..." value="${esc(window.BizUiFilters?.bookingsSearch || '')}" style="min-width:260px;">
          </div>
          <div class="segmented">
            ${statuses.map((st) => `
              <button class="segmented-btn ${statusFilter === st ? 'active' : ''}" data-booking-status-filter="${st}">
                ${st === 'all' ? 'Все' : esc(cfg.terms.statusMap[st] || st)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      ${rows.length === 0 && !search && statusFilter === 'all' ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">${window.BizIcons.svg('bookings', 28)}</div>
            <h3 class="empty-state-title">Пока нет событий</h3>
            <p class="empty-state-desc">Создайте первую ${esc(cfg.terms.bookingSingular.toLowerCase())} — она сразу появится в журнале и в календаре</p>
            <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
          </div>
        </div>
      ` : `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>${esc(cfg.terms.clientSingular)}</th>
                <th>Позиция / Услуга</th>
                <th>${esc(cfg.terms.staffSingular)}</th>
                <th>${esc(cfg.terms.extraFieldLabel)}</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((b) => {
                const cl = data.clients.find((c) => c.id === b.clientId);
                const st = data.staff.find((s) => s.id === b.staffId);
                const sv = data.services.find((s) => s.id === b.serviceId);
                return `
                  <tr class="clickable" data-open-booking="${b.id}">
                    <td>
                      <div class="cell-primary tabular-nums">${esc(b.time)}</div>
                      <div class="cell-sub">${formatDateRu(b.date)}</div>
                    </td>
                    <td>
                      <div class="cell-primary">${esc(cl ? cl.name : '—')}</div>
                      <div class="cell-sub">${esc(cl ? cl.phone : '')}</div>
                    </td>
                    <td>
                      <div class="cell-primary">${esc(sv ? sv.name : '—')}</div>
                      <div class="cell-sub">${b.duration || 60} мин • ${esc(b.channel)}</div>
                    </td>
                    <td>${esc(st ? st.name : '—')}</td>
                    <td><span class="cell-sub">${esc(b.extra || '—')}</span></td>
                    <td class="tabular-nums"><strong>${window.BizStore.formatMoney(b.price)}</strong></td>
                    <td>${statusPill(b.status, cfg)}</td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">Ничего не найдено по выбранным фильтрам</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      `}
    `;
  }

  /* --------------------------------------------------------------------------
     4. CRM CLIENTS VIEW
     -------------------------------------------------------------------------- */
  function renderClients(state, cfg, data) {
    const search = (window.BizUiFilters?.clientsSearch || '').toLowerCase();
    const seg = window.BizUiFilters?.clientsSegment || 'all';

    const list = data.clients.filter((c) => {
      if (seg !== 'all' && c.segment !== seg) return false;
      if (!search) return true;
      return `${c.name} ${c.phone} ${c.tag} ${c.note}`.toLowerCase().includes(search);
    });

    const segments = ['all', 'VIP', 'Постоянный', 'Новый', 'Спящий'];

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">CRM: ${esc(cfg.terms.clientsPlural)}</h2>
          <p class="view-subheading">База профилей, LTV, история визитов и сегментация</p>
        </div>
        <button class="btn btn-primary" data-action="open-client-modal">${window.BizIcons.svg('plus', 15)} Добавить: ${esc(cfg.terms.clientSingular)}</button>
      </div>

      <div class="toolbar">
        <div class="toolbar-group">
          <div class="input-wrap">
            <span class="input-icon">${window.BizIcons.svg('search', 15)}</span>
            <input class="input with-icon" id="clients-search-input" type="text" placeholder="Имя, телефон, заметка..." value="${esc(window.BizUiFilters?.clientsSearch || '')}" style="min-width:250px;">
          </div>
          <div class="segmented">
            ${segments.map((s) => `
              <button class="segmented-btn ${seg === s ? 'active' : ''}" data-client-segment="${s}">
                ${s === 'all' ? `Все (${data.clients.length})` : s}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      ${list.length === 0 && !search && seg === 'all' ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">${window.BizIcons.svg('clients', 28)}</div>
            <h3 class="empty-state-title">База клиентов пуста</h3>
            <p class="empty-state-desc">Добавьте первого профиля (${esc(cfg.terms.clientSingular.toLowerCase())}), чтобы вести историю визитов и LTV</p>
            <button class="btn btn-primary" data-action="open-client-modal">${window.BizIcons.svg('plus', 15)} Добавить: ${esc(cfg.terms.clientSingular)}</button>
          </div>
        </div>
      ` : `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${esc(cfg.terms.clientSingular)}</th>
                <th>Сегмент</th>
                <th>Визиты</th>
                <th>Выручка (LTV)</th>
                <th>Последний визит</th>
                <th>Метка / Особенность</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((c) => {
                const segTone = c.segment === 'VIP' ? 'pill-accent'
                  : c.segment === 'Постоянный' ? 'pill-success'
                  : c.segment === 'Новый' ? 'pill-info' : 'pill-warning';
                return `
                  <tr class="clickable" data-open-client="${c.id}">
                    <td>
                      <div style="display:flex; align-items:center; gap:11px;">
                        <div class="avatar">${esc(initials(c.name))}</div>
                        <div>
                          <div class="cell-primary">${esc(c.name)}</div>
                          <div class="cell-sub">${esc(c.phone)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="pill ${segTone}">${esc(c.segment)}</span></td>
                    <td class="tabular-nums"><strong>${c.visits}</strong></td>
                    <td class="tabular-nums"><strong>${window.BizStore.formatMoney(c.ltv)}</strong></td>
                    <td>${formatDateRu(c.lastVisit)}</td>
                    <td><span class="pill pill-neutral">${esc(c.tag || '—')}</span></td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Нет профилей по заданному фильтру</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      `}
    `;
  }

  /* --------------------------------------------------------------------------
     5. CATALOG (SERVICES & INVENTORY) VIEW
     -------------------------------------------------------------------------- */
  function renderCatalog(state, cfg, data) {
    const tab = window.BizUiFilters?.catalogTab || 'all';
    const search = (window.BizUiFilters?.catalogSearch || '').toLowerCase();

    const items = data.services.filter((item) => {
      if (tab !== 'all' && item.kind !== tab) return false;
      if (!search) return true;
      return `${item.name} ${item.category} ${item.sku || ''}`.toLowerCase().includes(search);
    });

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">${esc(cfg.terms.serviceTab)} и ${esc(cfg.terms.productTab)}</h2>
          <p class="view-subheading">Прайс-лист, длительность слотов, складские остатки и маржинальность</p>
        </div>
        <button class="btn btn-primary" data-action="open-service-modal">${window.BizIcons.svg('plus', 15)} Добавить позицию</button>
      </div>

      <div class="toolbar">
        <div class="toolbar-group">
          <div class="input-wrap">
            <span class="input-icon">${window.BizIcons.svg('search', 15)}</span>
            <input class="input with-icon" id="catalog-search-input" type="text" placeholder="Поиск по названию, категории, SKU..." value="${esc(window.BizUiFilters?.catalogSearch || '')}" style="min-width:250px;">
          </div>
          <div class="segmented">
            <button class="segmented-btn ${tab === 'all' ? 'active' : ''}" data-catalog-tab="all">Все (${data.services.length})</button>
            <button class="segmented-btn ${tab === 'service' ? 'active' : ''}" data-catalog-tab="service">${esc(cfg.terms.serviceTab)}</button>
            <button class="segmented-btn ${tab === 'product' ? 'active' : ''}" data-catalog-tab="product">${esc(cfg.terms.productTab)}</button>
          </div>
        </div>
      </div>

      ${items.length === 0 && !search && tab === 'all' ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">${window.BizIcons.svg('catalog', 28)}</div>
            <h3 class="empty-state-title">Каталог пока пуст</h3>
            <p class="empty-state-desc">Добавьте ваши услуги или товары с ценами, длительностью и остатками на складе</p>
            <button class="btn btn-primary" data-action="open-service-modal">${window.BizIcons.svg('plus', 15)} Добавить позицию</button>
          </div>
        </div>
      ` : `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Категория</th>
                <th>Цена</th>
                ${state.settings.showMargin ? '<th>Маржа</th>' : ''}
                <th>Длительность / Остаток</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => {
                const margin = item.price > 0 ? Math.round(((item.price - (item.cost || 0)) / item.price) * 100) : 0;
                const isLow = item.kind === 'product' && item.stock <= (item.minStock || 5);
                return `
                  <tr>
                    <td>
                      <div class="cell-primary">${esc(item.name)}</div>
                      <div class="cell-sub">${item.kind === 'product' ? `SKU: ${esc(item.sku || '—')}` : 'Услуга / Сервис'}</div>
                    </td>
                    <td><span class="pill pill-neutral">${esc(item.category)}</span></td>
                    <td class="tabular-nums"><strong>${item.price === 0 ? 'Бесплатно' : window.BizStore.formatMoney(item.price)}</strong></td>
                    ${state.settings.showMargin ? `<td class="tabular-nums"><span class="pill ${margin >= 60 ? 'pill-success' : 'pill-neutral'}">${margin}%</span></td>` : ''}
                    <td>
                      ${item.kind === 'product'
                        ? `<div style="display:flex; align-items:center; gap:8px;">
                             <span class="pill ${isLow ? 'pill-danger' : 'pill-success'}">${item.stock} шт${isLow ? ' • Мало' : ''}</span>
                             <button class="btn btn-secondary btn-sm" data-restock-id="${item.id}" title="Пополнить на 5 шт">+5</button>
                           </div>`
                        : `<span class="tabular-nums">${item.duration || 60} мин</span>`
                      }
                    </td>
                    <td>
                      <label class="switch" title="Включить / отключить позицию">
                        <input type="checkbox" ${item.active ? 'checked' : ''} data-toggle-service="${item.id}">
                        <span class="switch-slider"></span>
                      </label>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-sm" data-book-service="${item.id}">Оформить</button>
                    </td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">Ничего не найдено</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      `}
    `;
  }

  /* --------------------------------------------------------------------------
     6. STAFF / TEAM VIEW
     -------------------------------------------------------------------------- */
  function renderStaff(state, cfg, data) {
    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">Команда: ${esc(cfg.terms.staffPlural)}</h2>
          <p class="view-subheading">График смен, загрузка, рейтинг и личная выручка</p>
        </div>
        <button class="btn btn-primary" data-action="open-staff-modal">${window.BizIcons.svg('plus', 15)} Добавить сотрудника</button>
      </div>

      ${data.staff.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">${window.BizIcons.svg('staff', 28)}</div>
            <h3 class="empty-state-title">Команда ещё не добавлена</h3>
            <p class="empty-state-desc">Добавьте сотрудников (${esc(cfg.terms.staffPlural.toLowerCase())}), чтобы вести расписание и учитывать личную выручку</p>
            <button class="btn btn-primary" data-action="open-staff-modal">${window.BizIcons.svg('plus', 15)} Добавить сотрудника</button>
          </div>
        </div>
      ` : `
      <div class="cards-grid-3">
        ${data.staff.map((st) => {
          const isOff = st.status === 'Выходной';
          return `
            <div class="card staff-card">
              <div class="staff-card-top">
                <div class="avatar lg">${esc(initials(st.name))}</div>
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:700; font-size:15px;">${esc(st.name)}</div>
                  <div style="font-size:12.5px; color:var(--text-muted);">${esc(st.role)}</div>
                  <div style="margin-top:6px;">
                    <span class="pill ${isOff ? 'pill-neutral' : 'pill-success'}"><span class="pill-dot"></span>${esc(st.status)}</span>
                  </div>
                </div>
              </div>

              <div class="staff-stats">
                <div>
                  <div class="staff-stat-val tabular-nums">${window.BizStore.formatMoney(st.revenue)}</div>
                  <div class="staff-stat-lbl">Выручка/мес</div>
                </div>
                <div>
                  <div class="staff-stat-val tabular-nums">${st.bookingsCount}</div>
                  <div class="staff-stat-lbl">Событий</div>
                </div>
                <div>
                  <div class="staff-stat-val tabular-nums">★ ${st.rating.toFixed(2)}</div>
                  <div class="staff-stat-lbl">Рейтинг</div>
                </div>
              </div>

              <div>
                <div class="metric-row-head">
                  <span style="color:var(--text-secondary);">Загрузка смены</span>
                  <strong class="tabular-nums">${st.busy}%</strong>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${st.busy}%"></div></div>
              </div>

              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${(st.tags || []).map((t) => `<span class="pill pill-neutral">${esc(t)}</span>`).join('')}
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--border-subtle); font-size:12px; color:var(--text-muted);">
                <span>Смена: ${esc(st.schedule)}</span>
                <span>Ставка: <strong>${esc(st.commission)}</strong></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      `}
    `;
  }

  /* --------------------------------------------------------------------------
     7. ANALYTICS VIEW
     -------------------------------------------------------------------------- */
  function renderAnalytics(state, cfg, data) {
    if (!data.bookings.length && !data.staff.length) {
      return `
        <div class="view-header">
          <div>
            <h2 class="view-heading">Финансовая и операционная аналитика</h2>
            <p class="view-subheading">Экономика ${esc(data.businessName || 'вашего бизнеса')}: каналы, маржа и пиковые часы</p>
          </div>
        </div>
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">${window.BizIcons.svg('analytics', 28)}</div>
            <h3 class="empty-state-title">Пока недостаточно данных для отчётов</h3>
            <p class="empty-state-desc">Создайте первые записи и завершите их — здесь появятся реальная выручка, средний чек и статистика по каналам</p>
            <button class="btn btn-primary" data-action="open-booking-modal">${window.BizIcons.svg('plus', 15)} ${esc(cfg.terms.createBooking)}</button>
          </div>
        </div>
      `;
    }
    const totalRev = data.staff.reduce((s, st) => s + st.revenue, 0);
    const totalBookings = data.staff.reduce((s, st) => s + st.bookingsCount, 0);
    const avgTicket = totalBookings ? Math.round(totalRev / totalBookings) : 0;

    const svcRev = data.services.filter((s) => s.kind === 'service').reduce((a, b) => a + b.price, 0) || 1;
    const prodRev = data.services.filter((s) => s.kind === 'product').reduce((a, b) => a + b.price, 0) || 1;

    const channels = [
      { label: 'Повторные / База', value: 44, color: 'var(--accent)' },
      { label: 'Онлайн-запись и сайт', value: 29, color: '#10b981' },
      { label: 'Instagram / Telegram', value: 18, color: '#3b82f6' },
      { label: 'Карты и рекомендации', value: 9, color: '#f59e0b' }
    ];

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const hours = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const heatMatrix = [
      [35, 42, 48, 55, 76, 88, 72],
      [48, 54, 60, 68, 82, 92, 85],
      [40, 52, 58, 62, 74, 86, 79],
      [55, 64, 70, 78, 89, 95, 84],
      [78, 84, 88, 92, 97, 98, 75],
      [62, 68, 74, 81, 94, 91, 60]
    ];

    const heatmapRows = hours.map((hr, rIdx) => `
      <div style="font-size:11.5px; color:var(--text-muted); font-weight:600;">${hr}</div>
      ${heatMatrix[rIdx].map((val) => {
        const opacity = (0.14 + (val / 100) * 0.78).toFixed(2);
        const textColor = val > 62 ? '#fff' : 'var(--text-primary)';
        return `<div class="heatmap-cell tabular-nums" style="background:color-mix(in srgb, var(--accent) ${Math.round(opacity * 100)}%, transparent); color:${textColor};" title="Загрузка ${val}%">${val}%</div>`;
      }).join('')}
    `).join('');

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">Финансовая и операционная аналитика</h2>
          <p class="view-subheading">Экономика ${esc(data.businessName)}: каналы, маржа и пиковые часы загрузки</p>
        </div>
        <div class="toolbar-group">
          <button class="btn btn-secondary" data-action="export-report">${window.BizIcons.svg('download', 15)} Выгрузить P&amp;L (CSV)</button>
          <button class="btn btn-primary" data-action="print-z-report">${window.BizIcons.svg('fileText', 15)} Z-отчёт (PDF)</button>
        </div>
      </div>

      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Месячная выручка</div>
          <div class="kpi-value tabular-nums">${window.BizStore.formatMoney(totalRev)}</div>
          <div class="kpi-footer"><span class="kpi-delta up">+15.4%</span><span class="kpi-period">к пред. месяцу</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Всего событий за месяц</div>
          <div class="kpi-value tabular-nums">${totalBookings}</div>
          <div class="kpi-footer"><span class="kpi-delta up">+9.1%</span><span class="kpi-period">конверсия 84%</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Средний чек</div>
          <div class="kpi-value tabular-nums">${window.BizStore.formatMoney(avgTicket)}</div>
          <div class="kpi-footer"><span class="kpi-delta up">+6.2%</span><span class="kpi-period">с учётом допродаж</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Оценка чистой маржи</div>
          <div class="kpi-value tabular-nums">${window.BizStore.formatMoney(Math.round(totalRev * 0.34))}</div>
          <div class="kpi-footer"><span class="kpi-delta up">34%</span><span class="kpi-period">после ФОТ и закупок</span></div>
        </div>
      </section>

      <section class="cards-grid-2" style="margin-bottom:18px;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Каналы привлечения клиентов</h3>
              <div class="card-subtitle">Доля каждого источника в выручке</div>
            </div>
          </div>
          <div class="card-body">
            ${window.BizCharts.donutChart(channels)}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Структура каталога: Услуги vs Товары</h3>
              <div class="card-subtitle">Соотношение среднего прайса</div>
            </div>
          </div>
          <div class="card-body">
            ${window.BizCharts.donutChart([
              { label: cfg.terms.serviceTab, value: svcRev, color: 'var(--accent)' },
              { label: cfg.terms.productTab, value: prodRev, color: '#0ea5e9' }
            ])}
          </div>
        </div>
      </section>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Тепловая карта загрузки по часам и дням недели</h3>
            <div class="card-subtitle">Помогает планировать вывод сотрудников и акции на тихие часы</div>
          </div>
        </div>
        <div class="card-body">
          <div class="heatmap-grid">
            <div></div>
            ${days.map((d) => `<div style="text-align:center; font-size:12px; font-weight:600; color:var(--text-muted);">${d}</div>`).join('')}
            ${heatmapRows}
          </div>
        </div>
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     8. SETTINGS VIEW
     -------------------------------------------------------------------------- */
  function renderSettings(state, cfg, data) {
    const nicheCards = window.BizNiches.NICHE_ORDER.map((id) => {
      const n = window.BizNiches.NICHES[id];
      const active = id === state.activeNiche;
      return `
        <button class="niche-select-card ${active ? 'active' : ''}" data-select-niche="${id}" type="button">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="width:32px; height:32px; border-radius:8px; background:${n.accentSoft}; color:${n.accent}; display:grid; place-items:center;">
              ${window.BizIcons.svg(n.icon, 17)}
            </div>
            ${active ? '<span class="pill pill-accent">Активно</span>' : ''}
          </div>
          <div style="font-weight:700; font-size:14px;">${esc(n.name)}</div>
          <div style="font-size:12px; color:var(--text-secondary);">${esc(n.tagline)}</div>
        </button>
      `;
    }).join('');

    return `
      <div class="view-header">
        <div>
          <h2 class="view-heading">Настройки платформы и ниши</h2>
          <p class="view-subheading">Адаптируйте терминологию, валюту, модули и данные компании</p>
        </div>
        <div class="toolbar-group">
          <button class="btn btn-primary" data-action="open-billing-modal">Тариф и подписка</button>
          <button class="btn btn-secondary" data-action="reset-demo">Загрузить демо-данные</button>
          <button class="btn btn-danger" data-action="clear-demo">Убрать демо-данные (с нуля)</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Тип бизнеса (Ниша)</h3>
            <div class="card-subtitle">Интерфейс, KPI, статусы и термины адаптируются автоматически</div>
          </div>
        </div>
        <div class="card-body">
          <div class="niche-cards-grid">${nicheCards}</div>
        </div>
      </div>

      <div class="cards-grid-2">
        <form class="card" id="business-profile-form">
          <div class="card-header">
            <h3 class="card-title">Профиль компании</h3>
            <button class="btn btn-primary btn-sm" type="submit">Сохранить</button>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-field full">
                <label class="form-label">Название заведения / бренда</label>
                <input class="input" name="businessName" value="${esc(data.businessName)}" required>
              </div>
              <div class="form-field">
                <label class="form-label">Адрес филиала</label>
                <input class="input" name="address" value="${esc(data.address)}">
              </div>
              <div class="form-field">
                <label class="form-label">Телефон</label>
                <input class="input" name="phone" value="${esc(data.phone)}">
              </div>
              <div class="form-field">
                <label class="form-label">Часы работы</label>
                <input class="input" name="hours" value="${esc(data.hours)}">
              </div>
              <div class="form-field">
                <label class="form-label">Валюта расчётов</label>
                <select class="select" name="currency">
                  ${['₽', '$', '€', '₸'].map((cur) => `<option value="${cur}" ${state.currency === cur ? 'selected' : ''}>${cur}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </form>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Модули и автоматизация</h3>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
            ${[
              { key: 'smsReminders', title: 'Авто-напоминания в WhatsApp / SMS', sub: 'Отправка за 2 часа до начала визита' },
              { key: 'onlineBooking', title: 'Виджет онлайн-записи 24/7', sub: 'Синхронизация свободных слотов в реальном времени' },
              { key: 'autoStockDeduct', title: 'Авто-списание товаров со склада', sub: 'Уменьшение остатков при оформлении позиции' },
              { key: 'showMargin', title: 'Показывать маржинальность в каталоге', sub: 'Расчёт процента прибыли по каждой позиции' }
            ].map((opt) => `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
                <div>
                  <div style="font-weight:600; font-size:13.5px;">${opt.title}</div>
                  <div style="font-size:12px; color:var(--text-muted);">${opt.sub}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" ${state.settings[opt.key] ? 'checked' : ''} data-setting-toggle="${opt.key}">
                  <span class="switch-slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Ссылка для онлайн-записи клиентов</h3>
            <div class="card-subtitle">Дайте клиентам возможность записаться самостоятельно — 24/7, без звонков</div>
          </div>
        </div>
        <div class="card-body">
          <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
            <div class="form-field" style="flex:1; min-width:180px; margin-bottom:0;">
              <label class="form-label">Slug (адрес страницы записи)</label>
              <div style="display:flex; gap:6px; align-items:center;">
                <span style="font-size:13px; color:var(--text-secondary); white-space:nowrap;">${esc(location.host)}/book/</span>
                <input class="input" id="booking-slug-input" placeholder="my-salon" style="flex:1;"
                  value="${esc(state.settings.bookingSlug || '')}"
                  pattern="[a-z0-9\\-]{3,40}" title="3-40 символов: латиница, цифры, дефис">
              </div>
            </div>
            <button class="btn btn-primary" id="save-slug-btn" style="flex-shrink:0; margin-bottom:0;">Сохранить slug</button>
          </div>
          ${state.settings.bookingSlug ? `
          <div style="margin-top:12px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <span style="font-size:13px;">
              🔗 Ссылка для клиентов:
              <a href="/book/${esc(state.settings.bookingSlug)}" target="_blank" style="color:var(--accent); font-weight:600;">
                ${esc(location.host)}/book/${esc(state.settings.bookingSlug)}
              </a>
            </span>
            <button class="btn btn-secondary btn-sm" id="copy-booking-link-btn">
              Копировать
            </button>
          </div>` : `
          <p style="font-size:13px; color:var(--text-muted); margin-top:10px;">
            💡 После сохранения slug клиенты смогут записаться по ссылке <code>/book/ваш-slug</code>
          </p>`}
        </div>
      </div>

      <div class="cards-grid-2" style="margin-top:18px;">
        <form class="card" id="integrations-sms-form">
          <div class="card-header">
            <div>
              <h3 class="card-title">SMS-уведомления (SMSC.ru)</h3>
              <div class="card-subtitle">Напоминания клиентам о визите</div>
            </div>
            <button class="btn btn-primary btn-sm" type="submit">Сохранить</button>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">Логин SMSC.ru</label>
                <input class="input" name="smscLogin" value="${esc(state.settings.smscLogin || '')}" placeholder="my_login">
              </div>
              <div class="form-field">
                <label class="form-label">Пароль или API-ключ</label>
                <input class="input" type="password" name="smscPassword" value="${esc(state.settings.smscPassword || '')}" placeholder="••••••••">
              </div>
              <div class="form-field full">
                <label class="form-label">Отправлять напоминание</label>
                <select class="select" name="smsTiming">
                  <option value="2h" ${state.settings.smsTiming === '2h' || !state.settings.smsTiming ? 'selected' : ''}>За 2 часа до визита</option>
                  <option value="24h" ${state.settings.smsTiming === '24h' ? 'selected' : ''}>За 24 часа до визита</option>
                  <option value="both" ${state.settings.smsTiming === 'both' ? 'selected' : ''}>За 24ч и за 2ч</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Ранний доступ (Бета)</h3>
              <div class="card-subtitle">Все модули BizPilot открыты бесплатно на период тестирования</div>
            </div>
            <span class="pill pill-success">Активно</span>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
            <div style="font-size:13.5px; color:var(--text-secondary); line-height:1.5;">
              Вы используете полную версию платформы: CRM, календарь, онлайн-запись <code>/book/slug</code>, Z-отчёты и SMS-напоминания.
            </div>
            <div>
              <button type="button" class="btn btn-secondary btn-sm" data-action="open-billing-modal">Условия и заявка на тариф</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.BizViews = {
    esc,
    initials,
    statusPill,
    formatDateRu,
    renderDashboard,
    renderCalendar,
    renderBookings,
    renderClients,
    renderCatalog,
    renderStaff,
    renderAnalytics,
    renderSettings
  };
})();
