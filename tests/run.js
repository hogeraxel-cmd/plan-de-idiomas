// Pruebas de extremo a extremo: `npm test` (requiere playwright y Chromium).
// Levanta un servidor local, carga la app en un navegador sin ventana y revisa:
//  1. el currículo (todas las lecciones existen, los bloques diarios no se bloquean),
//  2. el avance bloqueado por lección, los atrasos y el historial (modo local),
//  3. la sincronización con una base Firebase simulada (tests/fake-firebase.js),
//  4. que la librería real de Firebase cargue y muestre la pantalla de entrada.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
const launch = () => chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? {} : {});
let failures = 0;
async function test(name, fn) {
  try { await fn(); console.log('ok   ' + name); }
  catch (e) { failures++; console.log('FAIL ' + name + '\n     ' + (e && e.message || e)); }
}

function curriculumTests() {
  global.window = undefined;
  require(path.join(ROOT, 'curriculum.js'));
  const C = globalThis.Curriculum;
  return test('currículo: 52 semanas sin errores', async () => {
    const trackKeys = new Set(C.TRACKS.map(t => t.k));
    Object.keys(C.STREAMS).forEach(st => {
      const s = C.STREAMS[st];
      assert(trackKeys.has(s.track), st + ' usa un bloque inexistente: ' + s.track);
      for (let n = 1; n <= 260; n++) {
        const c = s.f(n);
        assert(c && typeof c.t === 'string' && c.t && typeof c.d === 'string', st + '-' + n + ' sin título o descripción');
      }
    });
    const sch = C.schedule('2026-11-01', '2027-10-31');
    Object.keys(sch).forEach(st => assert(C.STREAMS[st], 'slotsFor usa un bloque inexistente: ' + st));
    let f = '2026-11-01';
    for (let i = 0; i < 365; i++) {
      const mins = C.slotsFor(f, '2026-11-01').reduce((a, s) => a + s[1], 0);
      assert(mins > 0 && mins <= 150, f + ' tiene ' + mins + ' minutos');
      f = C.date.addDays(f, 1);
    }
    assert(sch.frLec && sch.frLec[0] >= '2027-06-27', 'el francés debe empezar en la semana 35');
  });
}

async function page(browser, base, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }, opts && opts.ctx));
  const cfg = (opts && opts.config) || "window.APP_CONFIG={FIREBASE:{},INICIO:'2026-10-22'};";
  await ctx.route('**/config.js', r => r.fulfill({ contentType: 'text/javascript', body: cfg }));
  if (opts && opts.fake) {
    await ctx.route('**/firebase-app-compat.js', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'fake-firebase.js'), 'utf8') }));
    await ctx.route('**/firebase-auth-compat.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
    await ctx.route('**/firebase-firestore-compat.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  }
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  return { ctx, p };
}
const firstActive = (p, st) => p.locator('#v-hoy input[data-st="' + st + '"]:not(:checked):not(:disabled)').first();

async function main() {
  await curriculumTests();
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await launch();

  await test('avance bloqueado, atrasos e historial (modo local)', async () => {
    const { ctx, p } = await page(browser, base);
    await p.goto(base + '?hoy=2026-10-23'); await p.waitForSelector('#v-hoy .task');
    assert.match(await p.textContent('.status b'), /pendiente/, 'el 23 debe haber pendientes del 22');
    const n1 = await firstActive(p, 'arLec').getAttribute('data-n');
    assert.strictEqual(n1, '1', 'la primera lección de árabe debe ser la 1');
    assert(await p.locator('#v-hoy .lock').count() > 0, 'debe mostrar la lección bloqueada que sigue');
    await firstActive(p, 'arLec').click();
    await firstActive(p, 'anki').click();
    assert.strictEqual(await firstActive(p, 'arLec').getAttribute('data-n'), '2', 'tras completar la 1, se desbloquea la 2');

    await p.goto(base + '?hoy=2026-11-01'); await p.waitForSelector('#v-hoy .task');
    const before = await p.textContent('.status b');
    assert.match(before, /(\d+) lecciones pendientes/);
    assert.strictEqual(await firstActive(p, 'arLec').getAttribute('data-n'), '2', 'el árabe no avanza sin hacer la 2');
    await firstActive(p, 'arLec').click();
    const after = await p.textContent('.status b');
    assert(parseInt(after.match(/\d+/)[0]) === parseInt(before.match(/\d+/)[0]) - 1, 'completar una pendiente baja el contador');
    const done = p.locator('#v-hoy input[data-st="arLec"]:checked');
    assert.strictEqual(await done.count(), 1);
    await done.click();
    assert.strictEqual(await firstActive(p, 'arLec').getAttribute('data-n'), '2', 'desmarcar devuelve la lección');

    const hist = await p.$$eval('.hrow', els => els.map(e => e.innerText));
    assert(hist.length === 7, 'historial de 7 días');
    assert(hist.some(h => /Sin actividad/.test(h)), 'los días sin estudio se ven en el historial');
    await p.click('.hrow >> nth=0');
    assert.match(await p.textContent('#v-hoy .status b'), /Hiciste 0 de/);

    await p.click('[data-tab=ajustes]'); await p.click('#inicio-hoy'); await p.click('[data-tab=hoy]');
    assert.match(await p.textContent('.status b'), /Vas al día/, 'reorganizar desde hoy deja el plan al día');
    for (const tab of ['plan', 'resumen', 'ajustes', 'hoy']) {
      await p.click('[data-tab=' + tab + ']');
      assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'desborde horizontal en ' + tab);
    }
    assert.deepStrictEqual(p.errors, []);
    await ctx.close();
  });

  await test('PC en modo oscuro sin errores', async () => {
    const { ctx, p } = await page(browser, base, { ctx: { viewport: { width: 1280, height: 860 }, colorScheme: 'dark' } });
    await p.goto(base + '?hoy=2026-11-03'); await p.waitForSelector('#v-hoy .task');
    for (const tab of ['plan', 'resumen', 'ajustes']) await p.click('[data-tab=' + tab + ']');
    assert.deepStrictEqual(p.errors, []);
    await ctx.close();
  });

  await test('sincronización con Firebase simulado', async () => {
    const cfg = "window.APP_CONFIG={FIREBASE:{apiKey:'k',projectId:'p'},INICIO:'2026-11-01'};";
    const { ctx, p } = await page(browser, base, { fake: true, config: cfg });
    await p.goto(base + '?hoy=2026-11-02');
    await p.evaluate(() => localStorage.setItem('pdi2-cache:local', JSON.stringify({ ajustes: { inicio: '2026-11-01' }, prog: { done: { 'anki@2026-11-01': { v: true, fecha: '2026-11-01', at: '2026-11-01T20:00:00Z', st: 'anki', min: 10, t: 'Anki' } }, notas: {} } })));
    await p.reload(); await p.waitForSelector('#em');
    await p.fill('#em', 'a@b.com'); await p.fill('#pw', 'mala'); await p.click('#lbtn');
    await p.waitForFunction(() => !document.getElementById('lerr').hidden);
    assert.match(await p.textContent('#lerr'), /incorrectos/);
    await p.fill('#pw', 'clave123'); await p.click('#lbtn'); await p.waitForSelector('#v-hoy .task');
    const srv = () => p.evaluate(() => (JSON.parse(localStorage.getItem('FAKE_FS') || '{}')['users/u1/meta/progreso'] || {}).done || {});
    await p.waitForFunction(() => document.getElementById('sync').textContent === 'Guardado');
    assert('anki@2026-11-01' in await srv(), 'lo marcado en modo local se sube al entrar');
    await firstActive(p, 'arLec').click();
    await p.waitForFunction(() => ((JSON.parse(localStorage.getItem('FAKE_FS'))['users/u1/meta/progreso'] || {}).done || {})['arLec-1']);
    await ctx.setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event('offline')));
    await firstActive(p, 'anki').click();
    assert.strictEqual(await p.textContent('#sync'), 'Sin conexión');
    await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event('online')));
    await p.waitForFunction(() => document.getElementById('sync').textContent === 'Guardado');
    assert('anki@2026-11-02' in await srv(), 'lo marcado sin conexión se sube al volver');
    await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('pdi2-')).forEach(k => localStorage.removeItem(k)));
    await p.reload(); await p.waitForSelector('#v-hoy .task');
    await p.waitForFunction(() => document.querySelectorAll('#v-hoy input.chk:checked').length >= 2);
    assert(await p.isHidden('#v-login'), 'la sesión se mantiene al recargar');
    assert.deepStrictEqual(p.errors, []);
    await ctx.close();
  });

  await test('librería real de Firebase carga y pide entrar', async () => {
    const cfg = "window.APP_CONFIG={FIREBASE:{apiKey:'AIzaFake',authDomain:'demo.firebaseapp.com',projectId:'demo',appId:'1:1:web:1'},INICIO:'2026-11-01'};";
    const { ctx, p } = await page(browser, base, { config: cfg });
    await ctx.route(/googleapis\.com/, r => r.abort());
    await p.goto(base); await p.waitForSelector('#em', { timeout: 15000 });
    assert(await p.evaluate(() => !!(window.firebase && firebase.auth && firebase.firestore)));
    assert.deepStrictEqual(p.errors, []);
    await ctx.close();
  });

  await browser.close(); srv.close();
  console.log(failures ? '\n' + failures + ' prueba(s) fallaron' : '\nTodas las pruebas pasaron');
  process.exit(failures ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
