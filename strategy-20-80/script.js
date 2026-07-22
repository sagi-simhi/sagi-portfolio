(function(){
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var progressBar = document.getElementById('scrollProgressBar');

  function updateHeaderState(){
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 6);
  }

  function updateScrollProgress(){
    if (!progressBar) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  window.addEventListener('scroll', function(){
    updateHeaderState();
    updateScrollProgress();
  }, { passive:true });
  updateHeaderState();
  updateScrollProgress();

  /* ============================================================
     1. SEEDED RNG — Mulberry32 + Marsaglia-polar Gaussian
     ============================================================ */
  function mulberry32(a){
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeGaussian(rng){
    var spare = null;
    return function(){
      if (spare !== null){ var s0 = spare; spare = null; return s0; }
      var u, v, s;
      do { u = rng()*2-1; v = rng()*2-1; s = u*u+v*v; } while (s >= 1 || s === 0);
      var mul = Math.sqrt(-2*Math.log(s)/s);
      spare = v*mul;
      return u*mul;
    };
  }

  /* ============================================================
     2. REGIME-BASED MULTI-FACTOR RETURN MODEL
     96 months, Jul 2018 – Jun 2026. Monthly params.
     ============================================================ */
  var REGIMES = [
    { months:60, mktDrift: 0.0088, mktVol:0.032, valFactor:-0.0012 },
    { months:24, mktDrift:-0.0110, mktVol:0.058, valFactor:-0.0120 },
    { months:72, mktDrift: 0.0106, mktVol:0.034, valFactor:-0.0038 },
    { months:36, mktDrift:-0.0020, mktVol:0.048, valFactor: 0.0065 },
    { months:48, mktDrift: 0.0092, mktVol:0.030, valFactor:-0.0034 },
  ];
  var ASSETS = {
    base: { beta:1.00, betaValue:0.15, alpha: 0.0000, idioVol:0.0038 },
    acwi: { beta:0.97, betaValue:0.08, alpha:-0.0006, idioVol:0.0038 },
    spx:  { beta:1.07, betaValue:-0.05,alpha: 0.0020, idioVol:0.0048 },
    avgs: { beta:1.02, betaValue:1.05, alpha: 0.0015, idioVol:0.0115 },
  };
  var SEED = 555;

  function generateReturns(seed){
    var rng = mulberry32(seed);
    var gauss = makeGaussian(rng);
    var series = { base:[], acwi:[], spx:[], avgs:[] };
    for (var ri=0; ri<REGIMES.length; ri++){
      var reg = REGIMES[ri];
      for (var m=0; m<reg.months; m++){
        var marketShock = reg.mktDrift + gauss()*reg.mktVol;
        var valueShock = reg.valFactor + gauss()*0.010;
        for (var key in ASSETS){
          var a = ASSETS[key];
          var idio = gauss()*a.idioVol;
          var r = a.alpha + a.beta*marketShock + a.betaValue*valueShock + idio;
          series[key].push(r);
        }
      }
    }
    return series;
  }

  var DATA = generateReturns(SEED);

  var LABELS = (function(){
    var out = [];
    var d = new Date(2005, 0, 1);
    for (var i=0; i<240; i++){
      out.push(d.toLocaleString('en-US', { month:'short', year:'2-digit' }));
      d.setMonth(d.getMonth()+1);
    }
    return out;
  })();

  /* ============================================================
     3. FINANCIAL METRICS
     ============================================================ */
  var RF = 0.02;
  function annualizedReturn(returns){
    var total = 1;
    for (var i=0;i<returns.length;i++) total *= (1+returns[i]);
    var years = returns.length/12;
    return Math.pow(total, 1/years) - 1;
  }
  function annualizedVol(returns){
    var n = returns.length;
    var mean = 0; for (var i=0;i<n;i++) mean += returns[i]; mean/=n;
    var vsum = 0; for (i=0;i<n;i++) vsum += Math.pow(returns[i]-mean,2);
    var variance = vsum/(n-1);
    return Math.sqrt(variance)*Math.sqrt(12);
  }
  function maxDrawdown(returns){
    var peak=1, cum=1, maxDD=0;
    for (var i=0;i<returns.length;i++){
      cum *= (1+returns[i]);
      if (cum>peak) peak=cum;
      var dd=(cum-peak)/peak;
      if (dd<maxDD) maxDD=dd;
    }
    return maxDD;
  }
  function sharpeRatio(returns){
    return (annualizedReturn(returns)-RF)/annualizedVol(returns);
  }
  function computeMetrics(returns){
    return { cagr:annualizedReturn(returns), vol:annualizedVol(returns), mdd:maxDrawdown(returns), sharpe:sharpeRatio(returns) };
  }
  function cumulativeSeries(returns){
    var cum=1, out=[];
    for (var i=0;i<returns.length;i++){ cum*=(1+returns[i]); out.push((cum-1)*100); }
    return out;
  }
  function combine(baseArr, tiltArr, w){
    var out = new Array(baseArr.length);
    for (var i=0;i<baseArr.length;i++) out[i] = (1-w)*baseArr[i] + w*tiltArr[i];
    return out;
  }
  function sliceTail(arr, months){ return arr.slice(arr.length-months); }

  /* ============================================================
     4. FORMATTING
     ============================================================ */
  function fmtPct(x, d){ d = d===undefined?1:d; return (x*100).toFixed(d)+'%'; }
  function setText(id, text){ var el = document.getElementById(id); if(el) el.textContent = text; }
  function periodLabel(months){
    if (months===120) return '10-year backtest';
    return '10-year backtest';
  }

  /* ============================================================
     5. INSIGHT TEXT GENERATOR
     ============================================================ */
  function generateInsight(custom, base, weightPct, periodLbl){
    if (weightPct === 0){
      return 'No Factor Tilt is currently applied — the portfolio is 100% FTSE All-World. Move the slider right to introduce Small-Cap Value exposure via AVGS and compare the effect on ' + periodLbl + ' risk and return below.';
    }
    var cagrD = (custom.cagr - base.cagr) * 100;
    var volD = (custom.vol - base.vol) * 100;
    var mddD = (custom.mdd - base.mdd) * 100;
    var sharpeD = custom.sharpe - base.sharpe;
    var cagrPhrase = cagrD >= 0
      ? 'adds <strong>' + cagrD.toFixed(1) + ' pts</strong> of CAGR'
      : 'costs <strong>' + Math.abs(cagrD).toFixed(1) + ' pts</strong> of CAGR';
    var sharpePhrase;
    if (Math.abs(sharpeD) < 0.01) sharpePhrase = 'leaves the Sharpe Ratio essentially unchanged at <strong>' + custom.sharpe.toFixed(2) + '</strong>';
    else if (sharpeD > 0) sharpePhrase = 'lifts the Sharpe Ratio to <strong>' + custom.sharpe.toFixed(2) + '</strong>';
    else sharpePhrase = 'pulls the Sharpe Ratio down to <strong>' + custom.sharpe.toFixed(2) + '</strong>';
    return 'Over the ' + periodLbl + ' window, a <strong>' + weightPct + '%</strong> Factor Tilt ' + cagrPhrase + ' versus holding the Base Asset alone — at the cost of ' + volD.toFixed(1) + ' pts more volatility and a ' + Math.abs(mddD).toFixed(1) + '-pt deeper max drawdown. Net effect: it ' + sharpePhrase + '. This is the size and value premia at work — a compensated risk, not a free one.';
  }

  /* ============================================================
     6. CHARTS
     ============================================================ */
  var FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var FONT_SANS = "'Inter', sans-serif";
  Chart.defaults.font.family = FONT_SANS;

  var centerTextPlugin = {
    id:'centerText',
    afterDraw:function(chart){
      if (!chart.config.__centerText) return;
      var ctx = chart.ctx, area = chart.chartArea;
      var cx = (area.left+area.right)/2, cy=(area.top+area.bottom)/2;
      ctx.save();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle = '#14213d';
      ctx.font = "700 26px " + FONT_MONO;
      ctx.fillText(chart.__centerMain || '', cx, cy-9);
      ctx.fillStyle = '#71839a';
      ctx.font = "600 10px " + FONT_SANS;
      ctx.fillText(chart.__centerSub || '', cx, cy+15);
      ctx.restore();
    }
  };

  function createComparisonChart(canvasId, labelA, labelB, colorA, colorB){
    var ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
      type:'line',
      data:{
        labels: LABELS.slice(),
        datasets:[
          { label:labelA, data:[], borderColor:colorA, backgroundColor:'rgba(37,99,235,0.09)', borderWidth:2.4, pointRadius:0, tension:0.2 },
          { label:labelB, data:[], borderColor:colorB, backgroundColor:'transparent', borderWidth:2, pointRadius:0, tension:0.2, borderDash:[4,4] }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        animation: reduceMotion ? false : { duration:450, easing:'easeOutCubic' },
        interaction:{ mode:'index', intersect:false },
        scales:{
          x:{ grid:{ color:'rgba(20,33,61,0.05)', drawTicks:false }, border:{ color:'rgba(20,33,61,0.15)' }, ticks:{ color:'#71839a', maxTicksLimit:8, font:{family:FONT_MONO,size:10.5} } },
          y:{ grid:{ color:'rgba(20,33,61,0.06)' }, border:{ color:'rgba(20,33,61,0.15)' }, ticks:{ color:'#71839a', callback:function(v){ return v+'%'; }, font:{family:FONT_MONO,size:10.5} }, title:{ display:false } }
        },
        plugins:{
          legend:{ display:true, position:'top', align:'start', labels:{ color:'#5b6b7c', usePointStyle:true, pointStyle:'circle', padding:12, boxWidth:8, boxHeight:8, font:{family:FONT_SANS,size:11.5,weight:'500'} } },
          tooltip:{ backgroundColor:'#ffffff', titleColor:'#14213d', bodyColor:'#52647a', borderColor:'#dce9f4', borderWidth:1, padding:10, cornerRadius:8, titleFont:{family:FONT_MONO,size:11}, bodyFont:{family:FONT_MONO,size:11.5}, callbacks:{ label:function(ctx){ return ' ' + ctx.dataset.label + ':  ' + ctx.parsed.y.toFixed(2) + '%'; } } }
        }
      }
    });
  }

  var donutCtx = document.getElementById('donutChart').getContext('2d');
  var donutChart = new Chart(donutCtx, {
    type:'doughnut',
    data:{
      labels:['FTSE All-World','AVGS Factor Tilt'],
      datasets:[{ data:[80,20], backgroundColor:['#6b7f95','#f59e0b'], borderColor:'#ffffff', borderWidth:3, hoverOffset:6 }]
    },
    config:{ __centerText:true },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'72%',
      animation: reduceMotion ? false : { duration:500 },
      plugins:{
        legend:{ display:false },
        tooltip:{
          backgroundColor:'#ffffff', titleColor:'#14213d', bodyColor:'#52647a', borderColor:'#dce9f4', borderWidth:1,
          padding:10, titleFont:{family:FONT_SANS,size:12}, bodyFont:{family:FONT_MONO,size:12},
          callbacks:{ label:function(ctx){ return ' ' + ctx.label + ': ' + ctx.parsed + '%'; } }
        }
      }
    },
    plugins:[centerTextPlugin]
  });
  donutChart.config.__centerText = true;

  var equityCtx = document.getElementById('equityChart').getContext('2d');
  var seriesDefs = [
    { key:'custom', label:'Custom Portfolio', color:'#2563eb', width:2.75, dash:[], fill:true, hidden:false },
    { key:'spx',    label:'S&P 500 TR Index', color:'#14b8a6', width:1.75, dash:[], fill:false, hidden:false },
    { key:'acwi',   label:'MSCI ACWI Index', color:'#5b7cfa', width:1.75, dash:[5,3], fill:false, hidden:false },
    { key:'base',   label:'Global Equity Core', color:'#6b7f95', width:1.25, dash:[2,3], fill:false, hidden:true },
    { key:'avgs',   label:'Value Tilt', color:'#f59e0b', width:1.25, dash:[2,3], fill:false, hidden:true },
  ];
  var equityChart = new Chart(equityCtx, {
    type:'line',
    data:{
      labels: LABELS.slice(),
      datasets: seriesDefs.map(function(s){
        return {
          key:s.key, label:s.label, data:[], borderColor:s.color,
          backgroundColor: s.fill ? 'rgba(37,99,235,0.09)' : 'transparent',
          borderWidth:s.width, borderDash:s.dash, pointRadius:0, pointHoverRadius:4,
          pointHoverBackgroundColor:s.color, pointHoverBorderColor:'#ffffff', pointHoverBorderWidth:2,
          tension:0.15, fill:s.fill, hidden:s.hidden, order: s.key==='custom'?1:2
        };
      })
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      animation: reduceMotion ? false : { duration:500, easing:'easeOutCubic' },
      interaction:{ mode:'index', intersect:false },
      scales:{
        x:{
          grid:{ color:'rgba(20,33,61,0.05)', drawTicks:false },
          border:{ color:'rgba(20,33,61,0.15)' },
          ticks:{ color:'#71839a', maxTicksLimit:9, font:{family:FONT_MONO,size:10.5} }
        },
        y:{
          grid:{ color:'rgba(20,33,61,0.06)' },
          border:{ color:'rgba(20,33,61,0.15)' },
          ticks:{ color:'#71839a', callback:function(v){ return v+'%'; }, font:{family:FONT_MONO,size:10.5} },
          title:{ display:true, text:'Cumulative Return (%)', color:'#71839a', font:{family:FONT_SANS,size:11,weight:'600'} }
        }
      },
      plugins:{
        legend:{
          position:'top', align:'start',
          labels:{ color:'#5b6b7c', usePointStyle:true, pointStyle:'circle', padding:16, boxWidth:8, boxHeight:8, font:{family:FONT_SANS,size:11.5,weight:'500'} }
        },
        tooltip:{
          backgroundColor:'#ffffff', titleColor:'#14213d', bodyColor:'#52647a', borderColor:'#dce9f4', borderWidth:1,
          padding:11, cornerRadius:8, titleFont:{family:FONT_MONO,size:11}, bodyFont:{family:FONT_MONO,size:11.5},
          callbacks:{ label:function(ctx){ return ' ' + ctx.dataset.label + ':  ' + ctx.parsed.y.toFixed(2) + '%'; } }
        }
      }
    },
    plugins:[]
  });

  var compareAcwiChart = createComparisonChart('compareAcwiChart', 'Strategy 20-80', 'MSCI ACWI Index', '#2563eb', '#14b8a6');
  var compareSpxChart = createComparisonChart('compareSpxChart', 'Strategy 20-80', 'S&P 500 TR Index', '#2563eb', '#5b7cfa');

  function updateComparisonChart(chart, strategySeries, benchmarkSeries, labels){
    chart.data.labels = labels;
    chart.data.datasets[0].data = strategySeries;
    chart.data.datasets[1].data = benchmarkSeries;
    chart.update(reduceMotion ? 'none' : undefined);
  }

  function renderTable(rows){
    var tbody = document.getElementById('comparisonBody');
    var html = '';
    for (var i=0;i<rows.length;i++){
      var r = rows[i];
      html += '<tr class="' + (r.highlight?'row-highlight':'') + '">'
        + '<td class="row-name">' + (r.highlight?'<span class="dot gold"></span>':'<span class="dot ' + r.dot + '"></span>') + r.name + '</td>'
        + '<td class="mono">' + fmtPct(r.m.cagr) + '</td>'
        + '<td class="mono">' + fmtPct(r.m.vol) + '</td>'
        + '<td class="mono neg">' + fmtPct(r.m.mdd) + '</td>'
        + '<td class="mono">' + r.m.sharpe.toFixed(2) + '</td>'
        + '</tr>';
    }
    tbody.innerHTML = html;
  }

  function countUp(id, endValue, decimals, suffix){
    var el = document.getElementById(id);
    if (!el) return;
    if (reduceMotion){ el.textContent = endValue.toFixed(decimals)+suffix; return; }
    var start = null, duration = 850;
    function tick(ts){
      if (start===null) start = ts;
      var t = Math.min((ts-start)/duration, 1);
      var eased = 1-Math.pow(1-t,3);
      el.textContent = (endValue*eased).toFixed(decimals)+suffix;
      if (t<1) requestAnimationFrame(tick);
      else el.textContent = endValue.toFixed(decimals)+suffix;
    }
    requestAnimationFrame(tick);
  }

  var state = { weight:20, period:120 };
  var firstRender = true;

  function render(){
    var w = state.weight/100;
    var customFull = combine(DATA.base, DATA.avgs, w);

    var baseSlice   = sliceTail(DATA.base, state.period);
    var acwiSlice   = sliceTail(DATA.acwi, state.period);
    var spxSlice    = sliceTail(DATA.spx, state.period);
    var avgsSlice   = sliceTail(DATA.avgs, state.period);
    var customSlice = sliceTail(customFull, state.period);
    var labelSlice  = LABELS.slice(LABELS.length-state.period);

    var mCustom = computeMetrics(customSlice);
    var mBase   = computeMetrics(baseSlice);
    var mAcwi   = computeMetrics(acwiSlice);
    var mSpx    = computeMetrics(spxSlice);
    var mAvgs   = computeMetrics(avgsSlice);

    if (firstRender){
      countUp('m-cagr', mCustom.cagr*100, 1, '%');
      countUp('m-vol', mCustom.vol*100, 1, '%');
      countUp('m-mdd', mCustom.mdd*100, 1, '%');
      countUp('m-sharpe', mCustom.sharpe, 2, '');
    } else {
      setText('m-cagr', fmtPct(mCustom.cagr));
      setText('m-vol', fmtPct(mCustom.vol));
      setText('m-mdd', fmtPct(mCustom.mdd));
      setText('m-sharpe', mCustom.sharpe.toFixed(2));
    }
    setText('m-cagr-base', fmtPct(mBase.cagr));   setText('m-cagr-spx', fmtPct(mSpx.cagr));   setText('m-cagr-acwi', fmtPct(mAcwi.cagr));
    setText('m-vol-base', fmtPct(mBase.vol));     setText('m-vol-spx', fmtPct(mSpx.vol));     setText('m-vol-acwi', fmtPct(mAcwi.vol));
    setText('m-mdd-base', fmtPct(mBase.mdd));     setText('m-mdd-spx', fmtPct(mSpx.mdd));     setText('m-mdd-acwi', fmtPct(mAcwi.mdd));
    setText('m-sharpe-base', mBase.sharpe.toFixed(2)); setText('m-sharpe-spx', mSpx.sharpe.toFixed(2)); setText('m-sharpe-acwi', mAcwi.sharpe.toFixed(2));

    setText('tiltValue', state.weight+'%');
    setText('baseValue', (100-state.weight)+'%');
    var slider = document.getElementById('tiltSlider');
    slider.value = state.weight;
    slider.setAttribute('aria-valuenow', state.weight);
    slider.style.setProperty('--fill', (state.weight/50*100)+'%');

    donutChart.data.datasets[0].data = [100-state.weight, state.weight];
    donutChart.__centerMain = state.weight+'%';
    donutChart.__centerSub = 'FACTOR TILT';
    donutChart.update(reduceMotion ? 'none' : undefined);
    setText('donutBasePct', (100-state.weight)+'%');
    setText('donutTiltPct', state.weight+'%');

    equityChart.data.labels = labelSlice;
    var seriesData = { custom:cumulativeSeries(customSlice), spx:cumulativeSeries(spxSlice), acwi:cumulativeSeries(acwiSlice), base:cumulativeSeries(baseSlice), avgs:cumulativeSeries(avgsSlice) };
    equityChart.data.datasets.forEach(function(ds){ ds.data = seriesData[ds.key]; });
    equityChart.update(reduceMotion ? 'none' : undefined);

    updateComparisonChart(compareAcwiChart, cumulativeSeries(customSlice), cumulativeSeries(acwiSlice), labelSlice);
    updateComparisonChart(compareSpxChart, cumulativeSeries(customSlice), cumulativeSeries(spxSlice), labelSlice);

    renderTable([
      { name:'Custom Portfolio', m:mCustom, highlight:true },
      { name:'Global Equity Core', m:mBase, dot:'steel' },
      { name:'Value Tilt', m:mAvgs, dot:'golddim' },
      { name:'S&P 500 TR Index', m:mSpx, dot:'steel' },
      { name:'MSCI ACWI Index', m:mAcwi, dot:'acwi' },
    ]);

    document.getElementById('insightText').innerHTML = generateInsight(mCustom, mBase, state.weight, periodLabel(state.period));

    firstRender = false;
  }

  var tiltSlider = document.getElementById('tiltSlider');
  tiltSlider.addEventListener('input', function(e){
    state.weight = parseInt(e.target.value, 10);
    render();
  });

  var periodButtons = document.querySelectorAll('.period-btn');
  periodButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      periodButtons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      state.period = parseInt(btn.getAttribute('data-period'), 10);
      render();
    });
  });

  document.getElementById('printBtn').addEventListener('click', function(){ window.print(); });

  render();

})();