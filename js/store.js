(function () {
  const STORAGE_KEY = 'bizpilot_state_v4';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function buildDemoState() {
    const nichesData = {};
    for (const key of window.BizNiches.NICHE_ORDER) {
      const cfg = window.BizNiches.NICHES[key];
      nichesData[key] = {
        businessName: cfg.defaultBusinessName,
        address: cfg.address,
        phone: cfg.phone,
        hours: cfg.hours,
        staff: clone(cfg.staff),
        services: clone(cfg.services),
        clients: clone(cfg.clients),
        bookings: clone(cfg.bookings)
      };
    }

    return {
      activeNiche: 'barbershop',
      activeView: 'dashboard',
      theme: 'light',
      currency: '₽',
      sidebarCollapsed: false,
      calendarMode: 'day',
      calendarDate: window.BizNiches.today,
      revenueRange: '7d',
      demoMode: true,
      onboardingDone: true,
      ownerName: 'Алексей К.',
      settings: {
        smsReminders: true,
        onlineBooking: true,
        autoStockDeduct: true,
        showMargin: true
      },
      notifications: [
        { id: 'n1', title: 'Подтверждена новая онлайн-запись', time: '4 мин назад', unread: true },
        { id: 'n2', title: 'Низкий остаток на складе (ниже минимума)', time: '28 мин назад', unread: true },
        { id: 'n3', title: 'Сформирован ежедневный отчёт смены', time: '2 ч назад', unread: false }
      ],
      nichesData
    };
  }

  function buildEmptyState() {
    const nichesData = {};
    for (const key of window.BizNiches.NICHE_ORDER) {
      const cfg = window.BizNiches.NICHES[key];
      nichesData[key] = {
        businessName: '',
        address: '',
        phone: '',
        hours: cfg.hours,
        staff: [],
        services: [],
        clients: [],
        bookings: []
      };
    }

    return {
      activeNiche: 'barbershop',
      activeView: 'dashboard',
      theme: 'light',
      currency: '₽',
      sidebarCollapsed: false,
      calendarMode: 'day',
      calendarDate: window.BizNiches.today,
      revenueRange: '7d',
      demoMode: false,
      onboardingDone: false,
      ownerName: '',
      settings: {
        smsReminders: true,
        onlineBooking: true,
        autoStockDeduct: true,
        showMargin: true
      },
      notifications: [],
      nichesData
    };
  }

  function buildInitialState() {
    return buildDemoState();
  }

  const AUTH_TOKEN_KEY = 'bizpilot_auth_token';
  const AUTH_USER_KEY = 'bizpilot_auth_user';

  let state = loadState();
  let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  let authUser = (() => {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; }
  })();
  let syncTimer = null;
  const listeners = new Set();

  function isApiAvailable() {
    return typeof location !== 'undefined' && location.protocol.startsWith('http');
  }

  async function apiFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function scheduleServerSync() {
    if (!authToken || !isApiAvailable()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      apiFetch('/api/workspace', {
        method: 'PUT',
        body: JSON.stringify({ state })
      }).catch(() => {});
    }, 300);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildInitialState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.nichesData || !parsed.activeNiche) {
        return buildInitialState();
      }
      return parsed;
    } catch {
      return buildInitialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  function notify(skipServerSync = false) {
    saveState();
    if (!skipServerSync) scheduleServerSync();
    listeners.forEach((fn) => fn(state));
  }

  function getNicheConfig(nicheId = state.activeNiche) {
    return window.BizNiches.NICHES[nicheId] || window.BizNiches.NICHES.barbershop;
  }

  function getCurrentData() {
    return state.nichesData[state.activeNiche];
  }

  function formatMoney(amount) {
    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('ru-RU').format(Math.round(num));
    return `${formatted} ${state.currency}`;
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
  }

  window.BizStore = {
    getState() {
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getNicheConfig,
    getCurrentData,
    formatMoney,

    setView(view) {
      state.activeView = view;
      notify();
    },

    setNiche(nicheId) {
      if (!window.BizNiches.NICHES[nicheId]) return;
      state.activeNiche = nicheId;
      notify();
    },

    toggleTheme() {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      notify();
    },

    toggleSidebar() {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      notify();
    },

    setCalendarMode(mode) {
      state.calendarMode = mode;
      notify();
    },

    setCalendarDate(dateStr) {
      state.calendarDate = dateStr;
      notify();
    },

    setRevenueRange(range) {
      state.revenueRange = range;
      notify();
    },

    updateBusinessProfile(patch) {
      const data = getCurrentData();
      Object.assign(data, patch);
      notify();
    },

    updateGlobalSettings(patch) {
      if (patch.currency) state.currency = patch.currency;
      if (patch.settings) Object.assign(state.settings, patch.settings);
      notify();
    },

    addBooking(payload) {
      const data = getCurrentData();
      const service = data.services.find((s) => s.id === payload.serviceId);
      const price = payload.price !== undefined ? Number(payload.price) : (service ? service.price : 0);
      const duration = payload.duration !== undefined ? Number(payload.duration) : (service && service.duration ? service.duration : 60);

      const booking = {
        id: uid('bk'),
        clientId: payload.clientId,
        staffId: payload.staffId,
        serviceId: payload.serviceId,
        date: payload.date || window.BizNiches.today,
        time: payload.time || '12:00',
        duration,
        price,
        status: payload.status || 'confirmed',
        extra: payload.extra || '',
        channel: payload.channel || 'Администратор'
      };
      data.bookings.unshift(booking);

      // Update client stats if completed
      const client = data.clients.find((c) => c.id === booking.clientId);
      if (client) {
        client.lastVisit = booking.date;
        if (booking.status === 'completed') {
          client.visits += 1;
          client.ltv += booking.price;
        }
      }

      // Deduct stock if product and autoStockDeduct enabled
      if (state.settings.autoStockDeduct && service && service.kind === 'product' && typeof service.stock === 'number') {
        service.stock = Math.max(0, service.stock - 1);
      }

      state.notifications.unshift({
        id: uid('nt'),
        title: `Создана: ${getNicheConfig().terms.bookingSingular} на ${booking.time}`,
        time: 'Только что',
        unread: true
      });
      notify();
      return booking;
    },

    updateBookingStatus(bookingId, newStatus) {
      const data = getCurrentData();
      const bk = data.bookings.find((b) => b.id === bookingId);
      if (!bk) return;
      const prevStatus = bk.status;
      bk.status = newStatus;

      if (prevStatus !== 'completed' && newStatus === 'completed') {
        const client = data.clients.find((c) => c.id === bk.clientId);
        if (client) {
          client.visits += 1;
          client.ltv += bk.price;
          client.lastVisit = bk.date;
        }
        const staff = data.staff.find((s) => s.id === bk.staffId);
        if (staff) {
          staff.bookingsCount += 1;
          staff.revenue += bk.price;
        }
      }
      notify();
    },

    deleteBooking(bookingId) {
      const data = getCurrentData();
      data.bookings = data.bookings.filter((b) => b.id !== bookingId);
      notify();
    },

    addClient(payload) {
      const data = getCurrentData();
      const client = {
        id: uid('cl'),
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        segment: payload.segment || 'Новый',
        visits: 0,
        ltv: 0,
        lastVisit: window.BizNiches.today,
        note: payload.note || '',
        tag: payload.tag || 'Новый профиль'
      };
      data.clients.unshift(client);
      notify();
      return client;
    },

    updateClientNote(clientId, note) {
      const data = getCurrentData();
      const cl = data.clients.find((c) => c.id === clientId);
      if (cl) {
        cl.note = note;
        notify();
      }
    },

    addServiceOrProduct(payload) {
      const data = getCurrentData();
      const item = {
        id: uid('sv'),
        kind: payload.kind || 'service',
        name: payload.name.trim(),
        category: payload.category || 'Общее',
        price: Number(payload.price) || 0,
        duration: Number(payload.duration) || 60,
        cost: Number(payload.cost) || 0,
        stock: payload.kind === 'product' ? Number(payload.stock || 0) : undefined,
        minStock: payload.kind === 'product' ? Number(payload.minStock || 5) : undefined,
        sku: payload.sku || `BP-${Math.floor(100 + Math.random() * 899)}`,
        active: true,
        popular: 65
      };
      data.services.unshift(item);
      notify();
      return item;
    },

    toggleServiceActive(serviceId) {
      const data = getCurrentData();
      const sv = data.services.find((s) => s.id === serviceId);
      if (sv) {
        sv.active = !sv.active;
        notify();
      }
    },

    restockProduct(serviceId, delta = 5) {
      const data = getCurrentData();
      const sv = data.services.find((s) => s.id === serviceId);
      if (sv && typeof sv.stock === 'number') {
        sv.stock += delta;
        notify();
      }
    },

    addStaff(payload) {
      const data = getCurrentData();
      const member = {
        id: uid('st'),
        name: payload.name.trim(),
        role: payload.role.trim(),
        status: 'На смене',
        busy: 60,
        rating: 5.0,
        bookingsCount: 0,
        revenue: 0,
        commission: payload.commission || '40%',
        schedule: payload.schedule || data.hours,
        tags: payload.tags ? payload.tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Универсал']
      };
      data.staff.push(member);
      notify();
      return member;
    },

    markNotificationsRead() {
      state.notifications.forEach((n) => { n.unread = false; });
      notify();
    },

    completeOnboarding(nicheId, businessName, ownerName) {
      state.activeNiche = nicheId;
      state.onboardingDone = true;
      state.demoMode = false;
      state.ownerName = (ownerName || '').trim() || 'Владелец';
      const data = state.nichesData[nicheId];
      if (data) {
        data.businessName = (businessName || '').trim() || window.BizNiches.NICHES[nicheId].name;
        data.hours = window.BizNiches.NICHES[nicheId].hours;
      }
      notify();
    },

    clearDemoData() {
      const currentNiche = state.activeNiche;
      const currentTheme = state.theme;
      state = buildEmptyState();
      state.activeNiche = currentNiche;
      state.theme = currentTheme;
      state.activeView = 'dashboard';
      notify();
    },

    resetDemoData() {
      const currentNiche = state.activeNiche;
      const currentTheme = state.theme;
      state = buildDemoState();
      state.activeNiche = currentNiche;
      state.theme = currentTheme;
      notify();
    },

    getAuthUser() {
      return authUser;
    },

    async register(name, email, password) {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, initialState: state })
      });
      authToken = res.token;
      authUser = res.user;
      localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      state.ownerName = res.user.name;
      notify(true);
      return res.user;
    },

    async login(email, password) {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      authToken = res.token;
      authUser = res.user;
      localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      if (res.state && res.state.nichesData) {
        state = { ...buildDemoState(), ...res.state };
      }
      notify(true);
      return res.user;
    },

    async hydrateFromServer() {
      if (!authToken || !isApiAvailable()) return false;
      try {
        const [meRes, wsRes] = await Promise.all([
          apiFetch('/api/auth/me'),
          apiFetch('/api/workspace')
        ]);
        authUser = meRes.user;
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        if (wsRes.state && wsRes.state.nichesData) {
          state = { ...buildDemoState(), ...wsRes.state };
          notify(true);
        }
        return true;
      } catch {
        return false;
      }
    },

    logout() {
      authToken = '';
      authUser = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      notify(true);
    }
  };
})();
