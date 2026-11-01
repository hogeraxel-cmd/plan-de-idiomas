(function () {
  'use strict';
  var C = window.Curriculum, D = C.date;
  var CFG = window.APP_CONFIG || {};
  var FB = CFG.FIREBASE || {};
  var configured = !!(FB.apiKey && FB.projectId && window.firebase && window.firebase.initializeApp);

  // ---------- backend (Firebase: Auth + Firestore) ----------
  // users/{uid}/meta/progreso = { done: {key: entry}, notas: {fecha: text} }
  // users/{uid}/meta/ajustes  = { datos: {...} }
  // The Firestore rules only let each user reach their own users/{uid} tree.
  var sb = null;
  if (configured) {
    var fbApp = window.firebase.initializeApp(FB);
    var fbAuth = fbApp.auth(), fbDb = fbApp.firestore();
    var clean = function (o) { return JSON.parse(JSON.stringify(o)); };
    var base = function (uid) { return 'users/' + uid + '/meta/'; };
    sb = {
      session: function () {
        return new Promise(function (res) { var off = fbAuth.onAuthStateChanged(function (u) { off(); res(u); }); });
      },
      signIn: function (email, pw) { return fbAuth.signInWithEmailAndPassword(email, pw).then(function (c) { return c.user; }); },
      signOut: function () { return fbAuth.signOut(); },
      saveProg: function (uid, changes) {
        changes.actualizado = new Date().toISOString();
        return fbDb.doc(base(uid) + 'progreso').set(clean(changes), { merge: true });
      },
      saveAjustes: function (uid, datos) {
        return fbDb.doc(base(uid) + 'ajustes').set(clean({ datos: datos, actualizado: new Date().toISOString() }));
      },
      loadAll: function (uid) {
        return Promise.all([
          fbDb.doc(base(uid) + 'ajustes').get({ source: 'server' }),
          fbDb.doc(base(uid) + 'progreso').get({ source: 'server' })
        ]).then(function (r) {
          return {
            ajustes: r[0].exists ? (r[0].data().datos || null) : null,
            prog: r[1].exists ? r[1].data() : null
          };
        });
      }
    };
  }
  function userId(u) { return u ? (u.uid || u.id) : null; }

  var qs = new URLSearchParams(location.search);
  function today() {
    var o = qs.get('hoy');
    var testHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (testHost && o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o; // solo para pruebas locales
    return D.iso(new Date());
  }

  var WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var WD1 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MONL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var SETUP = [
    { id: 'anki-instalar', g: 'Anki en el PC', t: 'Instala Anki y crea tu cuenta', d: 'Gratis para Windows. Ábrelo y presiona Sincronizar para crear o iniciar tu cuenta de AnkiWeb.', link: { u: 'https://apps.ankiweb.net/', l: 'apps.ankiweb.net' } },
    { id: 'anki-importar', g: 'Anki en el PC', t: 'Importa el mazo inicial', d: 'Doble clic en «Plan de idiomas - mazo inicial.apkg», o Archivo → Importar.' },
    { id: 'lim-aleman', g: 'Límites de tarjetas nuevas', t: 'Alemán: 5 por día', d: 'Mazos → engranaje de «Alemán» → Opciones → Límites diarios → pestaña «Este mazo» → 5 → Guardar.' },
    { id: 'lim-arabe', g: 'Límites de tarjetas nuevas', t: 'Árabe: 4 por día', d: 'Lo mismo en el mazo «Árabe», con 4: coincide con las 4 letras de cada lección del alfabeto. La lección de árabe te avisa cuándo cambiarlo.' },
    { id: 'lim-ingles', g: 'Límites de tarjetas nuevas', t: 'Inglés: 5 por día', d: 'Lo mismo en el mazo «Inglés».' },
    { id: 'lim-plan', g: 'Límites de tarjetas nuevas', t: 'Plan de idiomas: 15 por día', d: 'Lo mismo en el mazo principal, con 15: es el tope cuando estudias todo junto.' },
    { id: 'anki-celular', g: 'Celular y acceso', t: 'Sincroniza y abre Anki en el celular', d: 'Presiona Sincronizar en el PC. En el celular entra a ankiweb.net con la misma cuenta (en Android también sirve AnkiDroid, gratis).', link: { u: 'https://ankiweb.net/', l: 'ankiweb.net' } },
    { id: 'instalar-celular', g: 'Celular y acceso', t: 'Instala esta app en el celular', d: 'Android: menú ⋮ → «Instalar app». iPhone: en Safari, Compartir → «Agregar a pantalla de inicio».' },
    { id: 'instalar-pc', g: 'Celular y acceso', t: 'Instala esta app en el PC', d: 'En Chrome o Edge, el ícono de instalar al final de la barra de direcciones. Queda en el escritorio y el menú Inicio.' },
    { id: 'recordatorio', g: 'Celular y acceso', t: 'Activa el recordatorio diario', d: 'Más abajo, en Recordatorio: elige la hora y agrégalo al calendario del celular.' }
  ];
  var DEFAULT_AJ = { inicio: CFG.INICIO || '2026-11-01', recordatorio: '20:00', puesta: { 'anki-instalar': true, 'anki-importar': true, 'lim-aleman': true, 'lim-arabe': true, 'lim-ingles': true, 'lim-plan': true, 'anki-celular': true } };

  var S = { user: null, ajustes: null, prog: { done: {}, notas: {} }, sel: null, tab: 'hoy', week: 0, ready: false };

  // ---------- storage ----------
  function ls(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function scope() { return S.user ? userId(S.user) : 'local'; }
  function saveCache() { ls('pdi2-cache:' + scope(), { ajustes: S.ajustes, prog: S.prog }); }
  function loadCache() {
    var c = ls('pdi2-cache:' + scope());
    S.ajustes = c && c.ajustes ? Object.assign(clone(DEFAULT_AJ), c.ajustes) : clone(DEFAULT_AJ);
    S.prog = (c && c.prog) || { done: {}, notas: {} };
    S.prog.done = S.prog.done || {}; S.prog.notas = S.prog.notas || {};
    sched = null;
  }

  // ---------- sync queue ----------
  // queue items: 'd:<key>' (a lesson marked or unmarked), 'n:<fecha>' (a note), 'ajustes'
  var queue = [], inflight = [], again = [];
  function loadQueue() { queue = ls('pdi2-queue:' + scope()) || []; }
  function saveQueue() { ls('pdi2-queue:' + scope(), queue); }
  function enqueue(k) {
    if (!sb) return;
    if (flushing && inflight.indexOf(k) >= 0 && again.indexOf(k) < 0) again.push(k);
    if (queue.indexOf(k) < 0) { queue.push(k); saveQueue(); }
    scheduleFlush();
  }
  function settle(sent) {
    queue = queue.filter(function (k) { return sent.indexOf(k) < 0 || again.indexOf(k) >= 0; });
    again = again.filter(function (k) { return sent.indexOf(k) < 0; });
    saveQueue();
  }
  var flushTimer = null, flushing = false;
  function scheduleFlush(ms) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, ms == null ? 400 : ms); }
  async function flush() {
    if (!sb || !S.user || flushing) return renderSync();
    if (!queue.length) return renderSync();
    if (!navigator.onLine) return renderSync();
    flushing = true; renderSync('saving');
    try {
      inflight = queue.filter(function (k) { return k !== 'ajustes'; }); again = [];
      if (inflight.length) {
        var changes = { done: {}, notas: {} };
        inflight.forEach(function (k) {
          if (k.indexOf('d:') === 0) { var e = S.prog.done[k.slice(2)]; if (e) changes.done[k.slice(2)] = e; }
          else if (k.indexOf('n:') === 0) changes.notas[k.slice(2)] = S.prog.notas[k.slice(2)] || '';
        });
        await sb.saveProg(userId(S.user), changes);
        settle(inflight);
      }
      if (queue.indexOf('ajustes') >= 0) {
        inflight = ['ajustes']; again = [];
        await sb.saveAjustes(userId(S.user), S.ajustes);
        settle(inflight);
      }
      inflight = []; flushing = false; renderSync();
      if (queue.length) scheduleFlush(100);
    } catch (e) {
      inflight = []; again = []; flushing = false; renderSync('error');
      scheduleFlush(15000);
    }
  }
  function newer(a, b) { return !b || (a && (a.at || '') >= (b.at || '')); }
  async function pull() {
    var r = await sb.loadAll(userId(S.user));
    var pend = {}; queue.forEach(function (k) { pend[k] = 1; });
    var rd = (r.prog && r.prog.done) || {}, rn = (r.prog && r.prog.notas) || {};
    Object.keys(rd).forEach(function (k) {
      if (pend['d:' + k]) return;
      if (newer(rd[k], S.prog.done[k])) S.prog.done[k] = rd[k];
    });
    Object.keys(rn).forEach(function (f) { if (!pend['n:' + f]) S.prog.notas[f] = rn[f]; });
    if (r.ajustes) { if (!pend.ajustes) { S.ajustes = Object.assign(clone(DEFAULT_AJ), r.ajustes); sched = null; } }
    else enqueue('ajustes');
    migrateLocal();
    saveCache();
  }
  // Progress made in local mode (before connecting Firebase) is uploaded on the first sign-in
  function migrateLocal() {
    if (!S.user || ls('pdi2-migrated:' + scope())) return;
    var loc = ls('pdi2-cache:local');
    if (loc && loc.prog) {
      Object.keys(loc.prog.done || {}).forEach(function (k) {
        if (newer(loc.prog.done[k], S.prog.done[k])) { S.prog.done[k] = loc.prog.done[k]; enqueue('d:' + k); }
      });
      Object.keys(loc.prog.notas || {}).forEach(function (f) {
        if (!S.prog.notas[f] && loc.prog.notas[f]) { S.prog.notas[f] = loc.prog.notas[f]; enqueue('n:' + f); }
      });
      if (loc.ajustes && loc.ajustes.puesta) {
        S.ajustes.puesta = Object.assign({}, loc.ajustes.puesta, S.ajustes.puesta || {}); enqueue('ajustes');
      }
    }
    ls('pdi2-migrated:' + scope(), true);
  }

  // ---------- plan model ----------
  // Daily habits (Anki, Duolingo, weekly review…) are kept per date: key "stream@fecha".
  // Everything else is a sequence per stream: key "stream-n"; lesson n+1 unlocks when n is done.
  var sched = null, schedKey = '';
  function S_() {
    var horizon = D.addDays(today(), 60), k = S.ajustes.inicio + '|' + horizon;
    if (!sched || schedKey !== k) { sched = C.schedule(S.ajustes.inicio, horizon); schedKey = k; }
    return sched;
  }
  function isDaily(st) { return !!(C.STREAMS[st] && C.STREAMS[st].daily); }
  function keyOf(st, nOrFecha) { return isDaily(st) ? st + '@' + nOrFecha : st + '-' + nOrFecha; }
  function isDone(k) { var e = S.prog.done[k]; return !!(e && e.v); }
  function nextN(st) { var n = 1; while (isDone(st + '-' + n)) n++; return n; }
  function datesOf(st) { return S_()[st] || []; }
  function owedBy(st, f, inclusive) { // lessons of st scheduled before (or through) date f
    var ds = datesOf(st), c = 0;
    for (var i = 0; i < ds.length; i++) { if (ds[i] < f || (inclusive && ds[i] === f)) c++; else break; }
    return c;
  }
  function behind(st) { return Math.max(0, owedBy(st, today(), false) - (nextN(st) - 1)); }
  function dueDate(st, n) { return datesOf(st)[n - 1] || null; }
  function dailyIndex(st, f) { var i = datesOf(st).indexOf(f); return i < 0 ? 1 : i + 1; }
  function content(st, n) { return C.STREAMS[st].f(n); }
  function slotsOf(f) { return f < S.ajustes.inicio ? [] : C.slotsFor(f, S.ajustes.inicio); }
  function doneOn(f) {
    var out = [];
    Object.keys(S.prog.done).forEach(function (k) { var e = S.prog.done[k]; if (e.v && e.fecha === f) { var x = clone(e); x.key = k; out.push(x); } });
    return out.sort(function (a, b) { return (a.at || '') < (b.at || '') ? -1 : 1; });
  }
  function slotMet(f, st) {
    if (isDaily(st)) return isDone(keyOf(st, f));
    return doneOn(f).some(function (e) { return e.st === st; });
  }
  function dayInfo(f) {
    var sl = slotsOf(f), met = sl.filter(function (s) { return slotMet(f, s[0]); });
    return { slots: sl, met: met.length, planned: sl.reduce(function (a, s) { return a + s[1]; }, 0), doneMin: doneOn(f).reduce(function (a, e) { return a + (e.min || 0); }, 0) };
  }
  function totalBehind() {
    var t = 0; Object.keys(C.STREAMS).forEach(function (st) { if (!isDaily(st)) t += behind(st); }); return t;
  }

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function titleHTML(t) { return esc(t).replace(/\[([^\]]+)\]/g, '<span class="ara" lang="ar" dir="rtl">$1</span>'); }
  function guideHTML(g) {
    if (!g) return '';
    return '<div class="lg">' + g.map(function (l) { return '<div class="lc"><b lang="ar">' + esc(l[0]) + '</b><span><strong>' + esc(l[1]) + '</strong>' + esc(l[2]) + '</span></div>'; }).join('') + '</div>';
  }
  function plain(t) { return String(t).replace(/[\[\]]/g, ''); }
  function trackOf(st) { return C.STREAMS[st].track; }
  function langOfSt(st) { return C.langOf(trackOf(st)); }
  function trackLabel(k) { for (var i = 0; i < C.TRACKS.length; i++) if (C.TRACKS[i].k === k) return C.TRACKS[i].label; return k; }
  function fmtLong(f) { var d = D.parseISO(f); var w = WD[d.getDay()]; return w.charAt(0).toUpperCase() + w.slice(1) + ' ' + d.getDate() + ' de ' + MONL[d.getMonth()]; }
  function fmtShort(f) { var d = D.parseISO(f); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function fmtDay(f) { var d = D.parseISO(f); return WD1[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  var LOCK = '<svg class="lk" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>';
  function toast(msg) {
    var el = document.getElementById('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function copyText(text, fallbackEl) {
    var ok = function () { toast('Copiado'); };
    var sel = function () { if (!fallbackEl) return; var r = document.createRange(); r.selectNodeContents(fallbackEl); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selecciona y copia el texto'); };
    try { navigator.clipboard.writeText(text).then(ok, sel); } catch (e) { sel(); }
  }

  // ---------- sync indicator ----------
  function renderSync(state) {
    var el = document.getElementById('sync');
    if (!configured) { el.textContent = 'Modo local'; el.className = 'sync warn'; return; }
    if (!S.user) { el.textContent = ''; el.className = 'sync'; return; }
    if (state === 'saving') { el.textContent = 'Sincronizando…'; el.className = 'sync'; return; }
    if (!navigator.onLine) { el.textContent = 'Sin conexión'; el.className = 'sync warn'; return; }
    if (state === 'error' || queue.length) { el.textContent = 'Reintentando…'; el.className = 'sync warn'; return; }
    el.textContent = 'Guardado'; el.className = 'sync ok';
  }

  // ---------- views ----------
  function show(tab) {
    S.tab = tab;
    ['login', 'hoy', 'plan', 'resumen', 'ajustes'].forEach(function (v) { document.getElementById('v-' + v).hidden = v !== tab; });
    document.getElementById('tabs').hidden = tab === 'login';
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
      if (b.getAttribute('data-tab') === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    if (S.tab === 'login') return renderLogin();
    if (S.tab === 'hoy') renderHoy();
    else if (S.tab === 'plan') renderPlan();
    else if (S.tab === 'resumen') renderResumen();
    else if (S.tab === 'ajustes') renderAjustes();
  }

  function renderLogin(err) {
    var el = document.getElementById('v-login');
    el.innerHTML = '<div class="login card"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<h1>Plan de idiomas</h1><p class="muted">Entra una vez en cada dispositivo: la sesión queda guardada.</p>' +
      '<form id="loginf" class="view" novalidate>' +
      '<label class="field" for="em">Correo<input id="em" type="email" autocomplete="username" required></label>' +
      '<label class="field" for="pw">Contraseña<input id="pw" type="password" autocomplete="current-password" required></label>' +
      '<p class="err" id="lerr"' + (err ? '' : ' hidden') + '>' + esc(err || '') + '</p>' +
      '<button class="btn primary" type="submit" id="lbtn">Entrar</button></form></div>';
  }

  function mondayOf(f) { return D.addDays(f, -((D.weekday(f) + 6) % 7)); }
  function weekDays(f) { var m = mondayOf(f), r = []; for (var i = 0; i < 7; i++) r.push(D.addDays(m, i)); return r; }
  function dayDot(f) {
    var t = today(); if (f > t) return '';
    var di = dayInfo(f); if (!di.slots.length) return '';
    if (di.met === di.slots.length) return 'full';
    if (f < t) return di.met ? 'part' : 'late';
    return di.met ? 'part' : '';
  }

  // One task row. mode: 'active' | 'done' | 'readonly'
  function taskRow(o) {
    var lg = langOfSt(o.st), id = 'c-' + o.key.replace(/[^\w-]/g, '_'), h = [];
    h.push('<li class="task ' + lg + (o.mode === 'done' ? ' isdone' : '') + (o.mode === 'readonly' ? ' ro' : '') + '">');
    if (o.mode === 'readonly') h.push('<span class="chk ghost" aria-hidden="true"></span>');
    else h.push('<input class="chk" type="checkbox" id="' + id + '" data-key="' + esc(o.key) + '" data-st="' + o.st + '" data-n="' + (o.n || '') + '" data-min="' + o.min + '"' + (o.mode === 'done' ? ' checked' : '') + (o.locked ? ' disabled' : '') + '>');
    h.push('<div class="tbody"><div class="tline"><span class="chip">' + esc(trackLabel(trackOf(o.st))) + '</span>');
    (o.chips || []).forEach(function (c) { h.push('<span class="chip ' + (c.cls || '') + '">' + esc(c.t) + '</span>'); });
    h.push('</div><label class="tt"' + (o.mode === 'readonly' ? '' : ' for="' + id + '"') + '>' + titleHTML(o.c.t) + '</label>');
    if (o.mode !== 'done') h.push('<p class="td">' + titleHTML(o.c.d) + (o.c.link ? ' <a href="' + esc(o.c.link.u) + '" target="_blank" rel="noopener">' + esc(o.c.link.l) + '</a>' : '') + '</p>' + guideHTML(o.c.g));
    if (o.next) h.push('<p class="lock">' + LOCK + '<span>Luego: ' + titleHTML(o.next) + '. Se desbloquea al completar esta.</span></p>');
    h.push('</div><span class="min">' + o.min + ' min</span></li>');
    return h.join('');
  }

  function renderHoy() {
    var t = today(), f = S.sel || t, el = document.getElementById('v-hoy');
    var di = dayInfo(f), pct = di.planned ? Math.min(1, di.doneMin / di.planned) : 0;
    var rel = f === t ? 'Hoy' : (f < t ? 'Día pasado' : 'Próximo');
    var R = 31, CIRC = 2 * Math.PI * R, h = [];
    h.push('<div class="dayhead"><div class="t"><span class="eyebrow">' + rel + (di.planned ? ' · ' + di.planned + ' min' : '') + '</span><h1>' + esc(fmtLong(f)) + '</h1></div>');
    h.push('<div class="ring" aria-label="' + di.doneMin + ' de ' + di.planned + ' minutos"><svg viewBox="0 0 76 76"><circle class="bgc" cx="38" cy="38" r="' + R + '"/><circle class="fgc" cx="38" cy="38" r="' + R + '" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (CIRC * (1 - pct)).toFixed(1) + '"/></svg><div class="lbl">' + di.doneMin + '<small>de ' + di.planned + ' min</small></div></div></div>');
    h.push('<div class="daynav"><button class="btn icon" type="button" data-go="-7" aria-label="Semana anterior">‹</button><div class="weekstrip">');
    weekDays(f).forEach(function (x) {
      var dx = D.parseISO(x);
      h.push('<button type="button" class="ws' + (x === t ? ' today' : '') + (x === f ? ' sel' : '') + '" data-day="' + x + '" aria-label="' + esc(fmtLong(x)) + '"><span class="w">' + WD1[dx.getDay()] + '</span><span class="n">' + dx.getDate() + '</span><span class="dot ' + dayDot(x) + '"></span></button>');
    });
    h.push('</div><button class="btn icon" type="button" data-go="7" aria-label="Semana siguiente">›</button></div>');
    if (f !== t) h.push('<div class="row"><button class="btn" type="button" data-day="' + t + '">Volver a hoy</button></div>');

    if (f < S.ajustes.inicio) h.push('<div class="card empty">Este día es anterior al inicio de tu plan (' + esc(fmtShort(S.ajustes.inicio)) + ').</div>');
    else if (f === t) h.push(hoyToday(t));
    else if (f < t) h.push(hoyPast(f));
    else h.push(hoyFuture(f));

    if (f >= S.ajustes.inicio) h.push('<label class="field" for="nota">Nota del día (resultado de un test, errores, frases nuevas)<textarea id="nota" placeholder="Escribe lo que quieras recordar de este día"></textarea></label>');
    if (f === t) h.push(historyBlock(t));
    el.innerHTML = h.join('');
    var ta = document.getElementById('nota'); if (ta) ta.value = S.prog.notas[f] || '';
  }

  function activeFor(st, min, t, extraChips) {
    var n = nextN(st), c = content(st, n), due = dueDate(st, n), chips = (extraChips || []).slice();
    if (due && due < t) chips.push({ t: 'Pendiente desde el ' + fmtShort(due), cls: 'late' });
    return taskRow({ st: st, n: n, key: keyOf(st, n), min: min, c: c, mode: 'active', chips: chips, next: content(st, n + 1).t });
  }

  function hoyToday(t) {
    var h = [], sl = slotsOf(t), todaySt = {};
    sl.forEach(function (s) { todaySt[s[0]] = s[1]; });
    var tb = totalBehind();

    // Status
    if (tb > 0) {
      h.push('<div class="status late"><b>Tienes ' + tb + (tb === 1 ? ' lección pendiente' : ' lecciones pendientes') + ' de días anteriores.</b><span>Cada idioma avanza solo cuando completas la lección que le toca. Empieza por las pendientes.</span>');
      if (tb >= 5) h.push('<span class="reset"><span>¿Son demasiadas? Reorganiza el plan desde hoy: no pierdes lo que marcaste y cada idioma sigue desde la lección donde quedaste.</span><button class="btn" type="button" id="reset-hoy">Reorganizar desde hoy</button></span>');
      h.push('</div>');
    } else h.push('<div class="status ok"><b>Vas al día.</b><span>No tienes lecciones atrasadas.</span></div>');

    // Pending from earlier days, for streams that are not on today's plan (plus what you finished of them today)
    var pend = [], doneT = doneOn(t);
    Object.keys(C.STREAMS).forEach(function (st) {
      if (isDaily(st) || todaySt[st] != null) return;
      if (behind(st) > 0 || doneT.some(function (e) { return e.st === st; })) pend.push(st);
    });
    if (pend.length) {
      h.push('<h2 class="sec">Pendiente de días anteriores</h2><ul class="tasks">');
      pend.forEach(function (st) {
        var last = nextN(st) - 1;
        doneT.filter(function (e) { return e.st === st; }).forEach(function (e) {
          h.push(taskRow({ st: st, n: e.n, key: e.key, min: e.min || minOf(st), c: content(st, e.n), mode: 'done', locked: e.n !== last }));
        });
        var b = behind(st);
        if (b > 0) h.push(activeFor(st, minOf(st), t, b > 1 ? [{ t: b + ' pendientes en este bloque', cls: 'late' }] : []));
      });
      h.push('</ul>');
    }

    // Today's plan
    h.push('<h2 class="sec">Plan de hoy</h2><ul class="tasks">');
    sl.forEach(function (s) {
      var st = s[0], min = s[1];
      if (isDaily(st)) {
        var k = keyOf(st, t);
        h.push(taskRow({ st: st, key: k, min: min, c: content(st, dailyIndex(st, t)), mode: isDone(k) ? 'done' : 'active' }));
        return;
      }
      var doneToday = doneOn(t).filter(function (e) { return e.st === st; });
      var last = nextN(st) - 1;
      doneToday.forEach(function (e) {
        h.push(taskRow({ st: st, n: e.n, key: e.key, min: e.min || min, c: content(st, e.n), mode: 'done', locked: e.n !== last }));
      });
      var owedToday = owedBy(st, t, true), b = behind(st);
      if (nextN(st) - 1 < owedToday) {
        var chips = b > 1 ? [{ t: b + ' pendientes en este bloque', cls: 'late' }] : [];
        h.push(activeFor(st, min, t, chips));
      } else if (!doneToday.length) {
        h.push('<li class="task ' + langOfSt(st) + ' ro"><span class="chk ghost" aria-hidden="true"></span><div class="tbody"><div class="tline"><span class="chip">' + esc(trackLabel(trackOf(st))) + '</span></div><span class="tt">Al día en este bloque</span><p class="td">Ya adelantaste la lección de hoy.</p></div><span class="min"></span></li>');
      }
    });
    h.push('</ul>');
    return h.join('');
  }
  function minOf(st) {
    // typical minutes of a stream, from its next scheduled slot
    var ds = datesOf(st), f = ds.filter(function (d) { return d >= today(); })[0] || ds[ds.length - 1];
    var s = f ? slotsOf(f).filter(function (x) { return x[0] === st; })[0] : null;
    return s ? s[1] : 15;
  }

  function hoyPast(f) {
    var h = [], di = dayInfo(f), done = doneOn(f);
    h.push('<div class="status ' + (di.met === di.slots.length ? 'ok' : 'late') + '"><b>Hiciste ' + di.met + ' de ' + di.slots.length + ' bloques.</b><span>' + (di.met === di.slots.length ? 'Día completo.' : 'Lo que faltó de cada idioma aparece en Hoy como pendiente.') + '</span></div>');
    if (done.length) {
      h.push('<h2 class="sec">Lo que hiciste</h2><ul class="tasks">');
      done.forEach(function (e) { h.push(taskRow({ st: e.st, n: e.n, key: e.key, min: e.min || 0, c: { t: e.t || content(e.st, e.n || dailyIndex(e.st, f)).t, d: '' }, mode: 'readonly' }).replace('<li class="task', '<li class="task isdone')); });
      h.push('</ul>');
    }
    var missed = di.slots.filter(function (s) { return !slotMet(f, s[0]); });
    if (missed.length) {
      h.push('<h2 class="sec">Sin hacer</h2><ul class="list card">');
      missed.forEach(function (s) { h.push('<li><span><span class="dotl ' + langOfSt(s[0]) + '"></span>' + esc(trackLabel(trackOf(s[0]))) + '</span><span class="small">' + (isDaily(s[0]) ? 'hábito del día' : 'pasa a pendiente') + '</span></li>'); });
      h.push('</ul>');
    }
    return h.join('');
  }

  function hoyFuture(f) {
    var h = [], t = today();
    h.push('<p class="small">Así se ve ese día si avanzas una lección por bloque desde hoy. Las lecciones se desbloquean en orden.</p><ul class="tasks">');
    slotsOf(f).forEach(function (s) {
      var st = s[0], c;
      if (isDaily(st)) c = content(st, dailyIndex(st, f));
      else {
        var ds = datesOf(st), between = ds.filter(function (d) { return d >= t && d < f; }).length;
        c = content(st, nextN(st) + between);
      }
      h.push(taskRow({ st: st, key: st + '~' + f, min: s[1], c: c, mode: 'readonly' }));
    });
    h.push('</ul>');
    return h.join('');
  }

  function historyBlock(t) {
    var h = [], start = S.ajustes.inicio, rows = [];
    for (var i = 1; i <= 7; i++) { var f = D.addDays(t, -i); if (f < start) break; rows.push(f); }
    if (!rows.length) return '';
    h.push('<h2 class="sec">Lo que hiciste estos días</h2><ul class="hist card">');
    rows.forEach(function (f) {
      var di = dayInfo(f), done = doneOn(f), full = di.met === di.slots.length && di.slots.length;
      h.push('<li><button type="button" class="hrow" data-day="' + f + '"><span class="hd"><span class="hdate">' + esc(fmtDay(f)) + '</span><span class="hcount ' + (full ? 'ok' : (di.met ? '' : 'late')) + '">' + di.met + ' de ' + di.slots.length + '</span></span>');
      h.push('<span class="hdone">' + (done.length ? done.map(function (e) { return esc(plain(e.t || '')); }).join(' · ') : 'Sin actividad') + '</span></button></li>');
    });
    h.push('</ul>');
    return h.join('');
  }

  function renderPlan() {
    var t = today(), m = mondayOf(t), el = document.getElementById('v-plan'), days = [];
    for (var i = 0; i < 14; i++) days.push(D.addDays(m, i));
    var used = {}; days.forEach(function (f) { slotsOf(f).forEach(function (s) { used[trackOf(s[0])] = 1; }); });
    var tracks = C.TRACKS.filter(function (tr) { return used[tr.k]; });
    var h = [];
    h.push('<div><span class="eyebrow">Esta semana y la próxima</span><h1>Carta Gantt</h1></div>');
    h.push('<div class="card"><div class="legend"><span class="ar"><i class="sw"></i>Árabe</span><span class="de"><i class="sw"></i>Alemán</span><span class="en"><i class="sw"></i>Inglés</span>' + (used.frLec || used.frOido ? '<span class="fr"><i class="sw"></i>Francés</span>' : '') + '<span class="gen"><i class="sw"></i>General</span><span><i class="sw pend"></i>Por hacer</span><span><i class="sw late"></i>No hecho</span></div>');
    h.push('<p class="small" style="margin-top:6px">Cada celda muestra los minutos. Toca una para ver el día.</p>');
    h.push('<div class="scroller" style="margin-top:12px"><div class="grid" role="grid" aria-label="Bloques de estudio por día">');
    h.push('<div></div><div class="wk first">Semana del ' + fmtShort(days[0]) + '</div><div class="wk">Semana del ' + fmtShort(days[7]) + '</div>');
    h.push('<div class="rl small" style="--c:transparent">Bloque</div>');
    days.forEach(function (f) { var dx = D.parseISO(f); h.push('<button type="button" class="dh' + (f === t ? ' today' : '') + '" data-open-day="' + f + '"><span class="w">' + WD1[dx.getDay()] + '</span><span class="n">' + dx.getDate() + '</span></button>'); });
    var prev = null;
    tracks.forEach(function (tr) {
      var gs = prev && prev !== tr.lang ? ' gs' : ''; prev = tr.lang;
      h.push('<div class="rl ' + tr.lang + gs + '" title="' + esc(tr.label) + '">' + esc(tr.label) + '</div>');
      days.forEach(function (f) {
        var xs = slotsOf(f).filter(function (s) { return trackOf(s[0]) === tr.k; });
        var cls = 'cell' + gs + (f === t ? ' today' : '');
        if (!xs.length) { h.push('<div class="' + cls + '"></div>'); return; }
        var min = xs.reduce(function (a, s) { return a + s[1]; }, 0);
        var met = f <= t && xs.every(function (s) { return slotMet(f, s[0]); });
        var some = f <= t && xs.some(function (s) { return slotMet(f, s[0]); });
        var pc = met ? ' done' : (some ? ' part' : (f < t ? ' late' : ''));
        var tip = tr.label + ' — ' + min + ' min' + (met ? ', hecho' : (f < t ? ', no hecho' : ''));
        h.push('<div class="' + cls + '"><button type="button" class="pill ' + tr.lang + pc + '" data-open-day="' + f + '" title="' + esc(tip) + '" aria-label="' + esc(fmtLong(f) + ': ' + tip) + '">' + min + '</button></div>');
      });
    });
    h.push('<div class="tot lbl">Minutos del día</div>');
    days.forEach(function (f) { h.push('<div class="tot">' + (dayInfo(f).planned || '') + '</div>'); });
    h.push('</div></div></div>');
    h.push('<p class="small">Cada idioma avanza lección por lección: si un día no estudias, la lección no se pierde ni se salta, queda pendiente hasta que la hagas.</p>');
    el.innerHTML = h.join('');
  }

  function weekStats(offset) {
    var m = D.addDays(mondayOf(today()), offset * 7), days = [], t = today();
    for (var i = 0; i < 7; i++) days.push(D.addDays(m, i));
    var st = { days: days, planned: 0, done: 0, slots: 0, met: 0, full: 0, byLang: {} };
    days.forEach(function (f) {
      var di = dayInfo(f);
      di.slots.forEach(function (s) { var lg = langOfSt(s[0]); st.byLang[lg] = st.byLang[lg] || { p: 0, d: 0 }; st.byLang[lg].p += s[1]; });
      doneOn(f).forEach(function (e) { var lg = langOfSt(e.st); st.byLang[lg] = st.byLang[lg] || { p: 0, d: 0 }; st.byLang[lg].d += e.min || 0; });
      st.planned += di.planned; st.done += di.doneMin; st.slots += di.slots.length; st.met += di.met;
      if (f <= t && di.slots.length && di.met === di.slots.length) st.full++;
    });
    return st;
  }
  function streak() {
    var t = today(), n = 0, f = t;
    for (var i = 0; i < 400; i++) {
      if (f < S.ajustes.inicio) break;
      var di = dayInfo(f), full = di.slots.length && di.met === di.slots.length;
      if (full) n++; else if (f !== t) break;
      f = D.addDays(f, -1);
    }
    return n;
  }
  function pendingList() {
    var out = [];
    Object.keys(C.STREAMS).forEach(function (st) {
      if (isDaily(st)) return; var b = behind(st); if (!b) return;
      var n = nextN(st); out.push({ st: st, b: b, t: content(st, n).t, since: dueDate(st, n) });
    });
    return out;
  }
  function summaryText(st) {
    var L = C.LANGS, lines = ['Resumen de mi semana del ' + fmtShort(st.days[0]) + ' al ' + fmtShort(st.days[6]) + ' (plan de idiomas):'];
    lines.push('- Minutos: ' + st.done + ' de ' + st.planned + ' planificados; bloques hechos: ' + st.met + ' de ' + st.slots + '; días completos: ' + st.full + '.');
    Object.keys(st.byLang).forEach(function (k) { lines.push('- ' + L[k] + ': ' + st.byLang[k].d + ' de ' + st.byLang[k].p + ' min.'); });
    var p = pendingList();
    if (p.length) lines.push('- Pendientes hoy: ' + p.map(function (x) { return trackLabel(trackOf(x.st)) + ' (' + x.b + ', sigue con «' + plain(x.t) + '»)'; }).join('; ') + '.');
    var notas = st.days.map(function (f) { return (S.prog.notas[f] || '').trim() ? fmtShort(f) + ': ' + S.prog.notas[f].trim() : null; }).filter(Boolean);
    if (notas.length) lines.push('- Notas: ' + notas.join(' | '));
    lines.push('Con esto, ¿qué ajustarías del plan para la próxima semana?');
    return lines.join('\n');
  }
  function renderResumen() {
    var st = weekStats(S.week), el = document.getElementById('v-resumen'), L = C.LANGS;
    var label = S.week === 0 ? 'Esta semana' : (S.week === -1 ? 'Semana pasada' : 'Semana del ' + fmtShort(st.days[0]));
    var h = [];
    h.push('<div class="spread"><div><span class="eyebrow">' + fmtShort(st.days[0]) + ' – ' + fmtShort(st.days[6]) + '</span><h1>' + label + '</h1></div>');
    h.push('<div class="row"><button class="btn icon" type="button" data-week="-1" aria-label="Semana anterior">‹</button><button class="btn icon" type="button" data-week="1" aria-label="Semana siguiente"' + (S.week >= 0 ? ' disabled' : '') + '>›</button></div></div>');
    h.push('<div class="stats"><div class="stat"><b>' + st.done + '</b><span>de ' + st.planned + ' minutos</span></div><div class="stat"><b>' + st.met + '</b><span>de ' + st.slots + ' bloques</span></div><div class="stat"><b>' + st.full + '</b><span>días completos</span></div><div class="stat"><b>' + streak() + '</b><span>días seguidos completos</span></div></div>');
    h.push('<div class="card bars"><h2>Minutos por idioma</h2>');
    ['ar', 'de', 'en', 'fr', 'gen'].forEach(function (k) {
      var b = st.byLang[k]; if (!b) return;
      var p = b.p ? Math.min(100, Math.round(b.d * 100 / b.p)) : 0;
      h.push('<div class="bar ' + k + '"><span>' + L[k] + '</span><div class="track" role="img" aria-label="' + p + ' %"><div class="fill" style="width:' + p + '%"></div></div><span class="v">' + b.d + ' / ' + b.p + ' min</span></div>');
    });
    if (!st.planned) h.push('<p class="small">Esta semana no tiene plan registrado.</p>');
    h.push('</div>');
    var p = pendingList();
    h.push('<div class="card"><h2>Pendiente hoy</h2>');
    if (p.length) {
      h.push('<ul class="list" style="margin-top:6px">');
      p.forEach(function (x) { h.push('<li><span><span class="dotl ' + langOfSt(x.st) + '"></span>' + esc(trackLabel(trackOf(x.st))) + ': ' + titleHTML(x.t) + '</span><span class="small">' + x.b + (x.b === 1 ? ' lección' : ' lecciones') + '</span></li>'); });
      h.push('</ul>');
    } else h.push('<p class="small" style="margin-top:4px">Nada. Vas al día en todos los idiomas.</p>');
    h.push('</div>');
    var txt = summaryText(st);
    h.push('<div class="card view" style="gap:10px"><h2>Ajustar el plan con Claude</h2><p class="small">Copia este resumen y pégalo en tu conversación con Claude para ajustar la semana siguiente.</p><div class="prompt" id="sumtxt">' + esc(txt) + '</div><div class="row"><button class="btn primary" type="button" id="copysum">Copiar resumen</button></div></div>');
    el.innerHTML = h.join('');
  }

  var installEvt = null;
  function platform() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  }
  function standalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  function renderAjustes() {
    var el = document.getElementById('v-ajustes'), A = S.ajustes, h = [];
    var done = SETUP.filter(function (s) { return A.puesta && A.puesta[s.id]; }).length;
    h.push('<div><span class="eyebrow">Cuenta y configuración</span><h1>Ajustes</h1></div>');

    h.push('<div class="card view" style="gap:10px"><h2>Instalar la app</h2>');
    if (standalone()) h.push('<p class="small">Ya la estás usando como app instalada.</p>');
    else if (installEvt) h.push('<p class="small">Queda con su propio ícono y se abre sin la barra del navegador.</p><div class="row"><button class="btn primary" type="button" id="install">Instalar app</button></div>');
    else if (platform() === 'ios') h.push('<p class="small">En Safari: botón Compartir → «Agregar a pantalla de inicio».</p>');
    else if (platform() === 'android') h.push('<p class="small">En Chrome: menú ⋮ → «Instalar app» o «Agregar a pantalla principal».</p>');
    else h.push('<p class="small">En Chrome o Edge: el ícono de instalar al final de la barra de direcciones.</p>');
    h.push('</div>');

    h.push('<div class="card view" style="gap:10px"><h2>Recordatorio diario</h2><p class="small">Crea un evento diario en el calendario de tu celular, con aviso a la hora que elijas. Ábrelo y elige «Agregar» o «Importar».</p>');
    h.push('<div class="row"><label class="field" for="rhora" style="width:140px">Hora<input type="time" id="rhora" value="' + esc(A.recordatorio || '20:00') + '"></label></div>');
    h.push('<div class="row"><button class="btn primary" type="button" id="ics">Agregar al calendario</button></div>');
    if (platform() === 'ios' && standalone()) h.push('<p class="small">En iPhone, si no se abre el calendario, haz este paso desde Safari.</p>');
    h.push('</div>');

    var wk = Math.floor(Math.max(0, D.diffDays(A.inicio, today())) / 7) + 1, tb = totalBehind();
    h.push('<div class="card view" style="gap:10px"><h2>Tu plan</h2><p>Empezaste el ' + esc(fmtLong(A.inicio).toLowerCase()) + '. Vas en la semana ' + wk + ' de 52' + (tb ? ', con ' + tb + (tb === 1 ? ' lección pendiente.' : ' lecciones pendientes.') : ', al día.') + '</p>');
    h.push('<p class="small">Si quieres partir de nuevo sin atrasos, cambia la fecha de inicio a hoy. Lo que ya marcaste se mantiene y cada idioma sigue desde la lección donde quedaste.</p>');
    h.push('<div class="row"><label class="field" for="inicio" style="width:180px">Fecha de inicio<input type="date" id="inicio" value="' + esc(A.inicio) + '"></label></div>');
    h.push('<div class="row"><button class="btn" type="button" id="setinicio">Guardar fecha</button><button class="btn" type="button" id="inicio-hoy">Empezar desde hoy</button></div></div>');

    h.push('<div class="card setup view" style="gap:10px"><div class="spread"><h2>Puesta a punto</h2><span class="row"><span class="small">' + done + ' de ' + SETUP.length + '</span><span class="meter" aria-hidden="true">');
    SETUP.forEach(function (s) { h.push('<i' + (A.puesta && A.puesta[s.id] ? ' class="on"' : '') + '></i>'); });
    h.push('</span></span></div>');
    var g = null;
    SETUP.forEach(function (s) {
      if (s.g !== g) { if (g !== null) h.push('</ul>'); g = s.g; h.push('<div class="grp">' + esc(g) + '</div><ul class="tasks">'); }
      var on = !!(A.puesta && A.puesta[s.id]);
      h.push('<li class="task gen' + (on ? ' isdone' : '') + '"><input class="chk" type="checkbox" id="s-' + s.id + '" data-setup="' + s.id + '"' + (on ? ' checked' : '') + '><div class="tbody"><label class="tt" for="s-' + s.id + '">' + esc(s.t) + '</label><p class="td">' + esc(s.d) + (s.link ? ' <a href="' + s.link.u + '" target="_blank" rel="noopener">' + s.link.l + '</a>' : '') + '</p></div><span></span></li>');
    });
    h.push('</ul></div>');

    h.push('<div class="card view" style="gap:10px"><h2>Datos y cuenta</h2>');
    if (!configured) h.push('<p class="small">Modo local: tus datos se guardan solo en este navegador. Cuando conectes Firebase, lo que marques aquí se sube a tu cuenta al entrar por primera vez.</p>');
    else if (S.user) h.push('<p class="small">Sesión iniciada como ' + esc(S.user.email || '') + '. Tus datos se guardan en tu proyecto de Firebase.</p>');
    h.push('<div class="row"><button class="btn" type="button" id="export">Descargar copia de seguridad</button>' + (configured && S.user ? '<button class="btn" type="button" id="logout">Cerrar sesión</button>' : '') + '</div></div>');
    el.innerHTML = h.join('');
  }

  // ---------- actions ----------
  function setDone(key, st, n, min, val) {
    var t = today(), c = content(st, isDaily(st) ? dailyIndex(st, t) : n);
    if (val) S.prog.done[key] = { v: true, fecha: t, at: new Date().toISOString(), st: st, n: n || null, min: min, t: plain(c.t) };
    else {
      var prev = S.prog.done[key] || {};
      S.prog.done[key] = { v: false, fecha: prev.fecha || t, at: new Date().toISOString(), st: st, n: n || null, min: min, t: prev.t || plain(c.t) };
    }
    saveCache(); enqueue('d:' + key);
    renderHoy();
    if (val && !isDaily(st) && behind(st) === 0 && nextN(st) - 1 === owedBy(st, t, true)) toast('Al día en ' + trackLabel(trackOf(st)));
  }
  var notaTimer = null;
  function saveNota() {
    var f = S.sel || today(), ta = document.getElementById('nota'); if (!ta) return;
    if ((S.prog.notas[f] || '') === ta.value) return;
    S.prog.notas[f] = ta.value.slice(0, 4000); saveCache(); enqueue('n:' + f);
  }
  function saveAjustes() { saveCache(); enqueue('ajustes'); }
  function setInicio(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { toast('Elige una fecha válida'); return; }
    S.ajustes.inicio = v; sched = null; saveAjustes(); render();
    toast('Plan reorganizado desde el ' + fmtShort(v));
  }
  function makeICS(hhmm) {
    var p = hhmm.split(':'), now = new Date(), t = today().replace(/-/g, '');
    var stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var url = location.href.split('?')[0].split('#')[0];
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Plan de idiomas//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:plan-idiomas-' + Date.now() + '@plan-de-idiomas', 'DTSTAMP:' + stamp,
      'DTSTART:' + t + 'T' + p[0] + p[1] + '00', 'DURATION:PT90M', 'RRULE:FREQ=DAILY',
      'SUMMARY:Estudiar idiomas (90 min)', 'DESCRIPTION:Abre tu plan del día: ' + url, 'URL:' + url,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora de estudiar idiomas', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var tab = b.getAttribute('data-tab'); if (tab) { if (tab === 'hoy') S.sel = null; if (tab === 'resumen') S.week = 0; show(tab); return; }
    if (b.hasAttribute('data-day')) { saveNota(); S.sel = b.getAttribute('data-day'); renderHoy(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute('data-go')) { saveNota(); S.sel = D.addDays(S.sel || today(), +b.getAttribute('data-go')); renderHoy(); return; }
    if (b.hasAttribute('data-open-day')) { S.sel = b.getAttribute('data-open-day'); show('hoy'); return; }
    if (b.hasAttribute('data-week')) { S.week = Math.min(0, S.week + (+b.getAttribute('data-week'))); renderResumen(); return; }
    switch (b.id) {
      case 'copysum': copyText(document.getElementById('sumtxt').textContent, document.getElementById('sumtxt')); break;
      case 'ics':
        var hr = document.getElementById('rhora').value || '20:00';
        S.ajustes.recordatorio = hr; S.ajustes.puesta = S.ajustes.puesta || {}; S.ajustes.puesta.recordatorio = true; saveAjustes();
        download('recordatorio-idiomas.ics', makeICS(hr), 'text/calendar'); renderAjustes(); toast('Abre el archivo para agregarlo al calendario'); break;
      case 'setinicio': setInicio(document.getElementById('inicio').value); break;
      case 'inicio-hoy': case 'reset-hoy': setInicio(today()); break;
      case 'install':
        if (installEvt) { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; renderAjustes(); }); }
        break;
      case 'export':
        download('plan-idiomas-copia-' + today() + '.json', JSON.stringify({ ajustes: S.ajustes, progreso: S.prog }, null, 1), 'application/json'); break;
      case 'logout':
        sb.signOut().then(function () { S.user = null; S.prog = { done: {}, notas: {} }; show('login'); renderSync(); }); break;
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute('data-key')) setDone(t.getAttribute('data-key'), t.getAttribute('data-st'), +t.getAttribute('data-n') || null, +t.getAttribute('data-min') || 0, t.checked);
    else if (t.hasAttribute && t.hasAttribute('data-setup')) { S.ajustes.puesta = S.ajustes.puesta || {}; if (t.checked) S.ajustes.puesta[t.getAttribute('data-setup')] = true; else delete S.ajustes.puesta[t.getAttribute('data-setup')]; saveAjustes(); renderAjustes(); }
    else if (t.id === 'rhora') { S.ajustes.recordatorio = t.value; saveAjustes(); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'nota') { clearTimeout(notaTimer); notaTimer = setTimeout(saveNota, 800); } });
  document.addEventListener('focusout', function (e) { if (e.target.id === 'nota') { clearTimeout(notaTimer); saveNota(); } });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'loginf') return;
    e.preventDefault();
    var em = document.getElementById('em').value.trim(), pw = document.getElementById('pw').value, btn = document.getElementById('lbtn'), er = document.getElementById('lerr');
    if (!em || !pw) { er.hidden = false; er.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    btn.disabled = true; btn.textContent = 'Entrando…';
    sb.signIn(em, pw).then(function (user) { startUser(user); }, function (err) {
      var code = (err && err.code) || '';
      btn.disabled = false; btn.textContent = 'Entrar'; er.hidden = false;
      if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(code)) er.textContent = 'Correo o contraseña incorrectos.';
      else if (/network/.test(code)) er.textContent = 'Sin conexión. Revisa internet e inténtalo de nuevo.';
      else if (/too-many-requests/.test(code)) er.textContent = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
      else if (/operation-not-allowed/.test(code)) er.textContent = 'Falta activar «Correo electrónico/contraseña» en Firebase Authentication.';
      else if (/unauthorized-domain/.test(code)) er.textContent = 'Falta agregar esta dirección en Firebase → Authentication → Dominios autorizados.';
      else er.textContent = 'No se pudo entrar (' + (code || (err && err.message) || 'error desconocido') + ').';
    });
  });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (S.tab === 'ajustes') renderAjustes(); });
  window.addEventListener('appinstalled', function () { S.ajustes.puesta = S.ajustes.puesta || {}; S.ajustes.puesta[platform() === 'desktop' ? 'instalar-pc' : 'instalar-celular'] = true; saveAjustes(); toast('App instalada'); });
  window.addEventListener('online', function () { renderSync(); scheduleFlush(100); if (sb && S.user) refresh(); });
  window.addEventListener('offline', function () { renderSync(); });
  var lastDay = today();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !S.ready) return;
    if (today() !== lastDay) { lastDay = today(); S.sel = null; render(); }
    if (sb && S.user) refresh();
  });

  // ---------- boot ----------
  async function refresh() {
    try { await pull(); render(); scheduleFlush(50); }
    catch (e) { renderSync('error'); }
  }
  function startUser(user) {
    S.user = user || null; loadQueue(); loadCache(); S.ready = true;
    show('hoy');
    if (sb && S.user) {
      renderSync('saving');
      pull().then(function () { render(); scheduleFlush(50); }, function () { renderSync('error'); scheduleFlush(5000); });
    } else renderSync();
  }
  async function boot() {
    if (!configured) { startUser(null); return; }
    var user = await sb.session();
    if (user) startUser(user);
    else { show('login'); renderSync(); }
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  boot();
})();
