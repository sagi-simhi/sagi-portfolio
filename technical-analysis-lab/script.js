/* ============================================================
   Technical Analysis Lab - script.js
   Navbar scroll progress + logic accordions + five dedicated,
   independently animated mini-chart engines - one per indicator -
   all computed from first principles on synthetic streaming data.
   ============================================================ */

(() => {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = {
    up: '#0E9F6E',
    down: '#DC2626',
    ma: '#1D4ED8',
    ema: '#B45309',
    grid: '#E4E7EB',
    text: '#9AA3AF',
  };

  /* ---------------- navbar scroll progress ---------------- */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      bar.style.width = `${pct * 100}%`;
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------------- logic accordion toggles ---------------- */
  function initLogicToggles() {
    document.querySelectorAll('.logic-toggle').forEach((btn) => {
      const target = document.getElementById(btn.dataset.target);
      btn.addEventListener('click', () => {
        const willShow = target.classList.contains('hidden');
        target.classList.toggle('hidden');
        btn.textContent = willShow ? 'Hide logic ▴' : 'View logic ▾';
      });
    });
  }

  /* ---------------- shared canvas setup ---------------- */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssHeight = rect.height || 140;
    canvas.width = rect.width * dpr;
    canvas.height = cssHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: cssHeight };
  }

  function pathFromSeries(ctx, series, xFn, yFn) {
    ctx.beginPath();
    let started = false;
    series.forEach((v, i) => {
      if (v == null) return;
      const x = xFn(i);
      const y = yFn(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function pulseDot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------------- lightweight indicator math ---------------- */
  function smaSeries(values, period) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) sum -= values[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  function emaSeries(values, period) {
    const out = new Array(values.length).fill(null);
    const k = 2 / (period + 1);
    let prev = null;
    for (let i = 0; i < values.length; i++) {
      if (prev == null && i >= period - 1) {
        prev = values.slice(Math.max(0, i - period + 1), i + 1).reduce((a, b) => a + b, 0) / period;
      } else if (prev != null) {
        prev = values[i] * k + prev * (1 - k);
      }
      out[i] = prev;
    }
    return out;
  }

  function walkPrice(prices, driftBias = 0) {
    const last = prices[prices.length - 1];
    const next = last + driftBias + (Math.random() - 0.48) * 1.4;
    prices.push(next);
    if (prices.length > 60) prices.shift();
  }

  function seedPrice(seedVal = 100) {
    const prices = [];
    let p = seedVal;
    for (let i = 0; i < 60; i++) {
      p += (Math.random() - 0.48) * 1.4;
      prices.push(p);
    }
    return prices;
  }

  /* ---------------- Card: MA ---------------- */
  const maState = { prices: seedPrice(100) };

  function drawMA(canvas) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const prices = maState.prices;
    const n = prices.length;
    const min = Math.min(...prices), max = Math.max(...prices);
    const range = max - min || 1;
    const padTop = 14, padBottom = 10;
    const x = (i) => (i / (n - 1)) * w;
    const y = (v) => padTop + (h - padTop - padBottom) * (1 - (v - min) / range);

    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    pathFromSeries(ctx, prices, x, y);
    ctx.globalAlpha = 1;

    const sma20 = smaSeries(prices, 20);
    ctx.strokeStyle = COLORS.ma;
    ctx.lineWidth = 1.8;
    pathFromSeries(ctx, sma20, x, y);

    const lastSma = sma20[sma20.length - 1];
    if (lastSma != null) pulseDot(ctx, x(n - 1), y(lastSma), COLORS.ma);
  }

  /* ---------------- Card: EMA ---------------- */
  const emaState = { prices: seedPrice(96) };

  function drawEMA(canvas) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const prices = emaState.prices;
    const n = prices.length;
    const min = Math.min(...prices), max = Math.max(...prices);
    const range = max - min || 1;
    const padTop = 14, padBottom = 10;
    const x = (i) => (i / (n - 1)) * w;
    const y = (v) => padTop + (h - padTop - padBottom) * (1 - (v - min) / range);

    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    pathFromSeries(ctx, prices, x, y);
    ctx.globalAlpha = 1;

    const ema14 = emaSeries(prices, 14);
    ctx.strokeStyle = COLORS.ema;
    ctx.lineWidth = 1.8;
    pathFromSeries(ctx, ema14, x, y);

    const lastEma = ema14[ema14.length - 1];
    if (lastEma != null) pulseDot(ctx, x(n - 1), y(lastEma), COLORS.ema);
  }

  /* ---------------- Card: RSI ---------------- */
  const rsiState = { values: [] };

  function seedRSI() {
    let r = 50;
    for (let i = 0; i < 60; i++) {
      r += (50 - r) * 0.04 + (Math.random() - 0.5) * 9;
      r = Math.max(6, Math.min(94, r));
      rsiState.values.push(r);
    }
  }

  function stepRSI() {
    let r = rsiState.values[rsiState.values.length - 1];
    r += (50 - r) * 0.04 + (Math.random() - 0.5) * 9;
    r = Math.max(6, Math.min(94, r));
    rsiState.values.push(r);
    if (rsiState.values.length > 60) rsiState.values.shift();
  }

  function drawRSI(canvas) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const rsi = rsiState.values;
    const n = rsi.length;
    const padTop = 14, padBottom = 14;
    const x = (i) => (i / (n - 1)) * w;
    const y = (v) => padTop + (h - padTop - padBottom) * (1 - v / 100);

    ctx.strokeStyle = COLORS.grid;
    ctx.setLineDash([3, 3]);
    [30, 70].forEach((lvl) => {
      ctx.beginPath();
      ctx.moveTo(0, y(lvl));
      ctx.lineTo(w, y(lvl));
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.strokeStyle = COLORS.ema;
    ctx.lineWidth = 1.8;
    pathFromSeries(ctx, rsi, x, y);

    const lastRsi = rsi[rsi.length - 1];
    pulseDot(ctx, x(n - 1), y(lastRsi), COLORS.ema);
  }

  /* ---------------- Card: MACD ---------------- */
  const macdState = { macdLine: [] };

  function seedMACD() {
    let m = 0;
    for (let i = 0; i < 60; i++) {
      m += (0 - m) * 0.05 + (Math.random() - 0.5) * 0.35;
      macdState.macdLine.push(m);
    }
  }

  function stepMACD() {
    let m = macdState.macdLine[macdState.macdLine.length - 1];
    m += (0 - m) * 0.05 + (Math.random() - 0.5) * 0.35;
    macdState.macdLine.push(m);
    if (macdState.macdLine.length > 60) macdState.macdLine.shift();
  }

  function drawMACD(canvas) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const macdLine = macdState.macdLine;
    const signalLine = emaSeries(macdLine, 9);
    const hist = macdLine.map((v, i) => (signalLine[i] != null ? v - signalLine[i] : null));
    const n = macdLine.length;

    const finiteHist = hist.filter((v) => v != null);
    const maxAbs = Math.max(0.25, ...finiteHist.map((v) => Math.abs(v)));
    const padTop = 12, padBottom = 12;
    const x = (i) => (i / (n - 1)) * w;
    const y = (v) => padTop + (h - padTop - padBottom) * (1 - (v + maxAbs) / (maxAbs * 2));

    ctx.strokeStyle = COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(0, y(0));
    ctx.lineTo(w, y(0));
    ctx.stroke();

    const slot = w / n;
    hist.forEach((v, i) => {
      if (v == null) return;
      ctx.fillStyle = v >= 0 ? COLORS.up : COLORS.down;
      ctx.globalAlpha = 0.5;
      const barTop = Math.min(y(0), y(v));
      const barH = Math.max(1, Math.abs(y(0) - y(v)));
      ctx.fillRect(i * slot, barTop, Math.max(1, slot * 0.6), barH);
      ctx.globalAlpha = 1;
    });

    ctx.strokeStyle = COLORS.ma;
    ctx.lineWidth = 1.5;
    pathFromSeries(ctx, macdLine, x, y);

    ctx.strokeStyle = COLORS.ema;
    ctx.lineWidth = 1.5;
    pathFromSeries(ctx, signalLine, x, y);

    const lastMacd = macdLine[macdLine.length - 1];
    pulseDot(ctx, x(n - 1), y(lastMacd), COLORS.ma);
  }

  /* ---------------- Card: Volume ---------------- */
  const volumeState = { bars: [] };

  function seedVolume() {
    for (let i = 0; i < 44; i++) {
      volumeState.bars.push({ h: Math.pow(Math.random(), 1.6), up: Math.random() > 0.44 });
    }
  }

  function stepVolume() {
    volumeState.bars.push({ h: Math.pow(Math.random(), 1.6), up: Math.random() > 0.44 });
    if (volumeState.bars.length > 44) volumeState.bars.shift();
  }

  function drawVolume(canvas) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const bars = volumeState.bars;
    const n = bars.length;
    const slot = w / n;
    const padTop = 14, padBottom = 10;
    const usableH = h - padTop - padBottom;
    const avg = bars.reduce((a, b) => a + b.h, 0) / n;

    bars.forEach((b, i) => {
      const barH = Math.max(2, b.h * usableH);
      const x = i * slot;
      const yy = h - padBottom - barH;
      ctx.fillStyle = b.up ? COLORS.up : COLORS.down;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, yy, Math.max(1.5, slot * 0.6), barH);
      ctx.globalAlpha = 1;
    });

    const avgY = h - padBottom - avg * usableH;
    ctx.strokeStyle = COLORS.text;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, avgY);
    ctx.lineTo(w, avgY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ---------------- animation driver ---------------- */
  function initMiniCharts() {
    const canvases = {
      ma: document.getElementById('maMini'),
      ema: document.getElementById('emaMini'),
      rsi: document.getElementById('rsiMini'),
      macd: document.getElementById('macdMini'),
      volume: document.getElementById('volumeMini'),
    };
    if (Object.values(canvases).some((c) => !c)) return;

    seedRSI();
    seedMACD();
    seedVolume();

    const renderAll = () => {
      drawMA(canvases.ma);
      drawEMA(canvases.ema);
      drawRSI(canvases.rsi);
      drawMACD(canvases.macd);
      drawVolume(canvases.volume);
    };

    renderAll();

    if (REDUCED_MOTION) return; // static snapshot only, no looping animation

    const STEP_MS = 260;
    let last = performance.now();

    function loop(now) {
      if (now - last >= STEP_MS) {
        walkPrice(maState.prices, 0);
        walkPrice(emaState.prices, 0);
        stepRSI();
        stepMACD();
        stepVolume();
        renderAll();
        last = now;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    let resizeRaf = null;
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(renderAll);
    });
  }

  /* ---------------- init ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initLogicToggles();
    initMiniCharts();
  });
})();
