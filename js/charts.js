(function () {
  function sparkline(values, color = 'var(--accent)') {
    if (!values || values.length < 2) return '';
    const w = 78;
    const h = 28;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 4) + 2;
      const y = h - 4 - ((v - min) / range) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = pts[pts.length - 1].split(',');
    return `
      <svg class="kpi-spark" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true">
        <polyline points="${pts.join(' ')}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="${color}"/>
      </svg>
    `;
  }

  function revenueAreaChart(points, currency = '₽') {
    const w = 680;
    const h = 236;
    const padL = 52;
    const padR = 18;
    const padT = 18;
    const padB = 34;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;

    const vals = points.map((p) => p.value);
    const maxVal = Math.max(...vals, 1000) * 1.12;
    const minVal = 0;

    const coords = points.map((p, idx) => {
      const x = padL + (idx / Math.max(points.length - 1, 1)) * innerW;
      const y = padT + innerH - ((p.value - minVal) / (maxVal - minVal)) * innerH;
      return { ...p, x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = padT + innerH * (1 - t);
      const val = Math.round(maxVal * t);
      const shortVal = val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`;
      return `
        <line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border-subtle)" stroke-dasharray="3 3"/>
        <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--text-muted)">${shortVal}</text>
      `;
    }).join('');

    const step = Math.max(1, Math.ceil(coords.length / 8));
    const xLabels = coords.map((c, i) => {
      if (i % step !== 0 && i !== coords.length - 1) return '';
      return `<text x="${c.x.toFixed(1)}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${c.label}</text>`;
    }).join('');

    const dots = coords.map((c, i) => `
      <g class="chart-hit" data-index="${i}" data-label="${c.label}" data-value="${c.value}" data-count="${c.count}" data-x="${c.x}" data-y="${c.y}">
        <rect x="${(c.x - innerW / (coords.length * 2)).toFixed(1)}" y="${padT}" width="${Math.max(12, innerW / coords.length).toFixed(1)}" height="${innerH}" fill="transparent"/>
        <circle class="chart-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.2"/>
      </g>
    `).join('');

    return `
      <div class="chart-wrap" data-currency="${currency}">
        <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; overflow:visible; display:block;">
          <defs>
            <linearGradient id="bizAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.26"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.01"/>
            </linearGradient>
          </defs>
          ${gridLines}
          <path d="${areaPath}" fill="url(#bizAreaGrad)"/>
          <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          ${xLabels}
          ${dots}
        </svg>
        <div class="chart-tooltip"></div>
      </div>
    `;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, item) => s + item.value, 0) || 1;
    const r = 46;
    const c = 2 * Math.PI * r;
    let offset = 0;

    const arcs = segments.map((seg) => {
      const len = (seg.value / total) * c;
      const arc = `<circle cx="64" cy="64" r="${r}" fill="none" stroke="${seg.color}" stroke-width="14" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 64 64)"/>`;
      offset += len;
      return arc;
    }).join('');

    return `
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        <svg viewBox="0 0 128 128" width="128" height="128" style="flex-shrink:0;">
          <circle cx="64" cy="64" r="${r}" fill="none" stroke="var(--bg-subtle)" stroke-width="14"/>
          ${arcs}
          <text x="64" y="61" text-anchor="middle" font-size="16" font-weight="700" fill="var(--text-primary)">100%</text>
          <text x="64" y="77" text-anchor="middle" font-size="10.5" fill="var(--text-muted)">структура</text>
        </svg>
        <div style="flex:1; min-width:160px; display:flex; flex-direction:column; gap:10px;">
          ${segments.map((seg) => {
            const pct = Math.round((seg.value / total) * 100);
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="width:9px; height:9px; border-radius:3px; background:${seg.color}; display:inline-block;"></span>
                  <span style="color:var(--text-secondary);">${seg.label}</span>
                </div>
                <strong class="tabular-nums">${pct}%</strong>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function bindChartTooltips(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.chart-wrap').forEach((wrap) => {
      const tooltip = wrap.querySelector('.chart-tooltip');
      const currency = wrap.dataset.currency || '₽';
      if (!tooltip) return;
      wrap.querySelectorAll('.chart-hit').forEach((hit) => {
        hit.addEventListener('mouseenter', () => {
          const val = Number(hit.dataset.value || 0);
          const cnt = hit.dataset.count;
          const label = hit.dataset.label;
          const svg = wrap.querySelector('svg');
          const rect = svg.getBoundingClientRect();
          const vb = svg.viewBox.baseVal;
          const px = (Number(hit.dataset.x) / vb.width) * rect.width;
          const py = (Number(hit.dataset.y) / vb.height) * rect.height;
          tooltip.innerHTML = `<div style="font-weight:700;">${label}</div><div>${new Intl.NumberFormat('ru-RU').format(val)} ${currency} • ${cnt} событий</div>`;
          tooltip.style.left = `${px}px`;
          tooltip.style.top = `${py}px`;
          tooltip.classList.add('visible');
        });
        hit.addEventListener('mouseleave', () => {
          tooltip.classList.remove('visible');
        });
      });
    });
  }

  window.BizCharts = {
    sparkline,
    revenueAreaChart,
    donutChart,
    bindChartTooltips
  };
})();
