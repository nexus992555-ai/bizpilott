(function () {
  const esc = window.BizViews ? window.BizViews.esc : (s) => String(s ?? '').replace(/</g, '&lt;');

  /* ------------------------------------------------------------------ */
  /* Onboarding render                                                    */
  /* ------------------------------------------------------------------ */
  let _selectedNiche = null;
  let _step = 1;

  function renderOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    if (_step === 1) {
      overlay.innerHTML = buildStep1();
    } else {
      overlay.innerHTML = buildStep2();
    }

    bindOnboardingEvents();
  }

  function buildStep1() {
    const niches = window.BizNiches.NICHE_ORDER.map((id) => {
      const n = window.BizNiches.NICHES[id];
      const sel = _selectedNiche === id;
      return `
        <button class="onboarding-niche-btn ${sel ? 'selected' : ''}" data-pick-niche="${id}" type="button"
          style="${sel ? `border-color:${n.accent}; background:${n.accentSoft};` : ''}">
          <div class="onboarding-niche-icon" style="background:${n.accentSoft}; color:${n.accent};">
            ${window.BizIcons.svg(n.icon, 18)}
          </div>
          <span class="onboarding-niche-title">${n.name}</span>
          <span class="onboarding-niche-desc">${n.tagline}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="onboarding-card">
        <div class="onboarding-top">
          <div class="onboarding-brand">
            <div class="onboarding-brand-logo">${window.BizIcons.svg('dashboard', 20)}</div>
            <span class="onboarding-brand-name">BizPilot</span>
          </div>
          <div class="onboarding-step-label">Шаг 1 из 2</div>
          <h1 class="onboarding-heading">Выберите тип вашего бизнеса</h1>
          <p class="onboarding-sub">Интерфейс, термины и KPI адаптируются автоматически под вашу нишу</p>
          <div class="onboarding-steps">
            <div class="onboarding-step-dot active"></div>
            <div class="onboarding-step-dot"></div>
          </div>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-niche-grid">${niches}</div>
          <div class="onboarding-actions">
            <span style="font-size:12.5px; color:var(--text-muted);">
              ${_selectedNiche ? `Выбрано: <strong>${window.BizNiches.NICHES[_selectedNiche].name}</strong>` : 'Выберите нишу, чтобы продолжить'}
            </span>
            <button class="btn btn-primary" id="onboarding-next-btn" type="button" ${_selectedNiche ? '' : 'disabled'} style="min-width:140px;">
              Далее ${window.BizIcons.svg('chevronRight', 15)}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function buildStep2() {
    const n = window.BizNiches.NICHES[_selectedNiche];
    return `
      <div class="onboarding-card">
        <div class="onboarding-top">
          <div class="onboarding-brand">
            <div class="onboarding-brand-logo" style="background:${n.accent};">${window.BizIcons.svg(n.icon, 20)}</div>
            <span class="onboarding-brand-name">BizPilot</span>
          </div>
          <div class="onboarding-step-label">Шаг 2 из 2 — ${n.name}</div>
          <h1 class="onboarding-heading">Расскажите о вашем заведении</h1>
          <p class="onboarding-sub">Эти данные будут отображаться в интерфейсе. Их можно изменить в настройках в любой момент</p>
          <div class="onboarding-steps">
            <div class="onboarding-step-dot"></div>
            <div class="onboarding-step-dot active"></div>
          </div>
        </div>
        <div class="onboarding-body">
          <form id="onboarding-step2-form">
            <div class="onboarding-form-grid">
              <div class="form-field">
                <label class="form-label">Название заведения</label>
                <input class="input" id="ob-business-name" name="businessName"
                  placeholder="Напр.: Studio 54, Мой Барбершоп..." required
                  style="font-size:15px; padding:11px 14px;">
              </div>
              <div class="form-field">
                <label class="form-label">Ваше имя (управляющий / владелец)</label>
                <input class="input" id="ob-owner-name" name="ownerName"
                  placeholder="Напр.: Алексей Кузнецов" required
                  style="font-size:15px; padding:11px 14px;">
              </div>
            </div>
            <div class="onboarding-actions">
              <button type="button" class="btn btn-ghost" id="onboarding-back-btn">
                ${window.BizIcons.svg('chevronLeft', 15)} Назад
              </button>
              <button type="submit" class="btn btn-primary" style="min-width:160px;">
                Запустить BizPilot ${window.BizIcons.svg('sparkles', 15)}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function bindOnboardingEvents() {
    document.querySelectorAll('[data-pick-niche]').forEach((btn) => {
      btn.addEventListener('click', () => {
        _selectedNiche = btn.dataset.pickNiche;
        renderOnboarding();
      });
    });

    const nextBtn = document.getElementById('onboarding-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!_selectedNiche) return;
        _step = 2;
        renderOnboarding();
        setTimeout(() => document.getElementById('ob-business-name')?.focus(), 60);
      });
    }

    const backBtn = document.getElementById('onboarding-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        _step = 1;
        renderOnboarding();
      });
    }

    const form = document.getElementById('onboarding-step2-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const businessName = fd.get('businessName')?.trim();
        const ownerName = fd.get('ownerName')?.trim();
        if (!businessName) {
          document.getElementById('ob-business-name')?.focus();
          return;
        }
        // Apply niche accent immediately so the app renders with correct color
        const cfg = window.BizNiches.NICHES[_selectedNiche];
        document.documentElement.style.setProperty('--accent', cfg.accent);
        document.documentElement.style.setProperty('--accent-hover', cfg.accentHover);
        document.documentElement.style.setProperty('--accent-soft', cfg.accentSoft);
        document.documentElement.style.setProperty('--accent-ring', cfg.accentRing);

        window.BizStore.completeOnboarding(_selectedNiche, businessName, ownerName);

        // Hide with fade
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 220ms ease';
          setTimeout(() => overlay.classList.add('hidden'), 230);
        }
      });
    }
  }

  function showOnboarding() {
    _step = 1;
    _selectedNiche = null;
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.style.opacity = '';
    renderOnboarding();
  }

  window.BizOnboarding = { showOnboarding };
})();
