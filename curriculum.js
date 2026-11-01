/* Plan de idiomas — currículo y generador de días.
   Cada bloque del día sale de un "flujo" (stream). Los flujos marcados como carry
   repiten primero lo que quedó pendiente en días pasados; los demás avanzan siempre. */
(function (global) {
  'use strict';

  var LINKS = {
    lt: { u: 'https://www.languagetransfer.org/courses', l: 'languagetransfer.org' },
    dw: { u: 'https://learngerman.dw.com/', l: 'learngerman.dw.com' },
    anki: { u: 'https://ankiweb.net/', l: 'ankiweb.net' },
    tandem: { u: 'https://www.tandem.net/', l: 'tandem.net' },
    efset: { u: 'https://efset.org/ef-set-50', l: 'efset.org' }
  };

  // ---------- Árabe ----------
  var AR_ALF = [
    ['Alfabeto 1: [ا ب ت ث]', 'LingoDeer Árabe, unidad de alfabeto. Escribe cada letra 10 veces en sus formas aislada, inicial, media y final.'],
    ['Alfabeto 2: [ج ح خ]', 'Distingue ح (h raspada de garganta) de خ (como la j española). Repítelas en voz alta.'],
    ['Alfabeto 3: [د ذ ر ز و]', 'Estas letras no se unen a la letra que sigue. Copia 5 palabras que las usen.'],
    ['Repaso: lee sílabas', 'Repasa en LingoDeer las letras vistas y lee 10 sílabas en voz alta.'],
    ['Alfabeto 4: [س ش ص ض]', 'ص y ض son las versiones “gruesas” de س y د: la lengua baja y el sonido se oscurece.'],
    ['Alfabeto 5: [ط ظ ع غ]', 'Practica ع con un video de pronunciación: es el sonido más nuevo para ti.'],
    ['Alfabeto 6: [ف ق ك ل]', 'En egipcio, ق suele sonar como un corte en la garganta.'],
    ['Alfabeto 7: [م ن ه ي]', 'Con estas completas las 28 letras. Escribe el alfabeto completo una vez.'],
    ['Vocales cortas y sukun', 'Fatha, kasra, damma y sukun. Lee 15 palabras con vocales marcadas.'],
    ['Ta marbuta, hamza y tu nombre', 'Escribe tu nombre en árabe y 10 palabras de estas semanas sin mirar.']
  ];
  var AR_TEMAS = [
    'pronombres personales (ana, inta, inti…)', 'oraciones sin verbo “ser”', 'masculino y femenino', 'el artículo al- y las letras solares',
    'posesivos (mi, tu, su)', 'números del 1 al 10', 'la familia', 'comida y bebida', 'números del 11 al 100 y precios',
    'adjetivos y concordancia', 'lugares de la ciudad', 'preguntas: qué, dónde, cuándo, cómo', 'la hora y los días de la semana',
    'verbos en presente (1)', 'verbos en presente (2)', 'negación', 'el trabajo y las profesiones', 'rutina diaria',
    'colores y ropa', 'el plural', 'verbos en pasado (1)', 'verbos en pasado (2)', 'planes con “voy a”', 'viajes y transporte',
    'el cuerpo y la salud', 'comparativos', 'el clima', 'gustos y opiniones'
  ];
  var AR_CONV = [
    ['Primera charla: saludos', 'Pídele a Claude por voz: “Enséñame 5 saludos en árabe egipcio y practícalos conmigo”.'],
    ['Perfil en Tandem', 'Crea tu perfil gratis con árabe egipcio y alemán como idiomas a aprender. Escribe a 3 personas de Egipto que aprendan español.', LINKS.tandem],
    ['Presentarte', 'Con Claude por voz o en Tandem: tu nombre, de dónde eres y a qué te dedicas. Pasa 5 frases a Anki.'],
    ['Números y preguntas básicas', 'Números del 1 al 10, “¿cómo estás?” y “¿de dónde eres?”.'],
    ['Tu familia', 'Describe a tu familia con frases simples: cuántos son y cómo se llaman.'],
    ['Pedir comida', 'Simula un pedido en un restaurante: pedir, preguntar el precio, pagar.'],
    ['Tu trabajo', 'Explica en qué trabajas y dónde. Pide las palabras que te falten y pásalas a Anki.'],
    ['De compras', 'Pregunta precios, regatea un poco y usa números grandes.'],
    ['Tu día', 'Cuenta tu rutina de un día normal, de la mañana a la noche.'],
    ['Direcciones', 'Pregunta cómo llegar a un lugar y entiende la respuesta.'],
    ['Gustos', 'Qué te gusta y qué no: comida, música, deporte.'],
    ['El fin de semana', 'Cuenta qué hiciste el fin de semana usando el pasado.'],
    ['Planes', 'Cuenta qué vas a hacer la próxima semana.'],
    ['Un viaje', 'Cuenta un viaje que hiciste: dónde, con quién y qué te gustó.']
  ];

  // ---------- Alemán ----------
  var DE_CONV = [
    ['Primera charla: presentarte', 'Con Claude por voz: “Ich heiße…, ich komme aus…, ich bin…”. Pídele que hable lento y te corrija al final. Busca también personas de habla alemana que aprendan español.', LINKS.tandem],
    ['Números, días y la hora', 'Con Claude por voz o tu compañero de Tandem.'],
    ['Tu familia', 'Meine Familie: quiénes son, cuántos años tienen, dónde viven.'],
    ['En la cafetería', 'Pide, pregunta el precio y paga: Ich möchte…, Was kostet…?'],
    ['Tu trabajo', 'Was machst du beruflich? Explica en qué trabajas.'],
    ['Tu rutina', 'Cuenta tu día con verbos separables (aufstehen, einkaufen…).'],
    ['Tus gustos', 'Ich mag… / Ich mag … nicht / gern.'],
    ['El fin de semana', 'Cuenta tu fin de semana en Perfekt (habe gemacht, bin gegangen).'],
    ['Direcciones', 'Wo ist…? Wie komme ich zu…?'],
    ['Planes', 'Qué harás el próximo fin de semana.'],
    ['Un viaje', 'Cuenta un viaje en Perfekt.'],
    ['Opiniones', 'Ich finde…, weil… — da tu opinión sobre un tema simple.']
  ];
  var DE_SAB = [
    ['Pronunciación alemana', 'LingoDeer Alemán, unidad de pronunciación: ä, ö, ü, ch, ei/ie, la z y la w. Repite cada sonido en voz alta.'],
    ['Repaso: der, die, das', 'Repasa los artículos y los verbos sein y haben; escribe 5 frases sobre ti.'],
    ['Repaso: verbos en presente', 'Conjuga 5 verbos regulares y 3 irregulares (haben, sein, fahren). Escribe una frase con cada uno.'],
    ['Repaso: preguntas con W', 'Wer, was, wo, wann, wie, warum: escribe una pregunta con cada una y respóndela.'],
    ['Repaso: acusativo', 'den, einen, keinen: escribe 8 frases con objeto directo.'],
    ['Repaso: verbos modales', 'können, müssen, wollen, möchten: 8 frases, el infinitivo al final.'],
    ['Repaso: verbos separables', 'aufstehen, anrufen, einkaufen: 8 frases sobre tu día.'],
    ['Repaso: dativo', 'mit, bei, von, zu + dativo: 8 frases.'],
    ['Repaso: Perfekt con haben', 'Escribe 8 cosas que hiciste esta semana.'],
    ['Repaso: Perfekt con sein', 'Verbos de movimiento: gehen, fahren, kommen. 8 frases.'],
    ['Repaso: weil y dass', 'El verbo va al final: 8 frases con weil o dass.'],
    ['Repaso: Präteritum común', 'war, hatte, konnte, musste: 8 frases.']
  ];

  // ---------- Inglés ----------
  var EN_W = [
    '¿El trabajo remoto mejora la productividad?', 'Una decisión difícil que tomaste y qué aprendiste de ella',
    '¿Debería ser gratuita la educación universitaria?', 'El mejor consejo profesional que has recibido',
    '¿Las redes sociales hacen más daño que bien?', 'Un problema de tu ciudad y cómo lo resolverías',
    '¿Conviene aprender varios idiomas a la vez?', 'Un libro, serie o película que te cambió la forma de pensar',
    '¿Debería reducirse la semana laboral a cuatro días?', 'Una crítica constructiva de tu industria',
    '¿La tecnología nos hace más o menos productivos?', 'Cómo te imaginas tu vida en diez años'
  ];
  var EN_S = [
    '¿Debería usarse la IA en los colegios?', '¿Vale la pena vivir en una ciudad grande?',
    '¿Hay que prohibir los autos en el centro de las ciudades?', '¿Es mejor ser especialista o generalista?',
    '¿Debería existir un ingreso básico universal?', '¿El turismo masivo debería limitarse?',
    '¿Es más importante el talento o el esfuerzo?', '¿Deberían los países invertir en exploración espacial?',
    '¿El trabajo híbrido es el mejor modelo?', '¿Hay que pagar más impuestos por la carne?',
    '¿Los exámenes estandarizados miden bien el aprendizaje?', '¿Es ético usar animales en la investigación?'
  ];
  var EN_G = [
    'inversión (Never have I…, Not only… but also…)', 'condicionales mixtas (If I had…, I would be…)',
    'cleft sentences (What I need is…, It was… that…)', 'subjuntivo formal (I suggest he be…)',
    'participios reducidos (Having finished…, Given that…)', 'énfasis con do/does/did',
    'phrasal verbs de trabajo (follow up, carry out, set up)', 'verbos modales en pasado (should have, might have)',
    'conectores formales (nonetheless, whereas, hence)', 'colocaciones con make, do, take, have'
  ];

  // ---------- Francés (desde el mes 9) ----------
  var FR_TEMAS = ['pronunciación y saludos', 'presentarte', 'artículos y género', 'verbos être y avoir', 'números', 'la familia',
    'comida', 'verbos en -er', 'preguntas', 'la hora', 'tu rutina', 'pasado compuesto (passé composé)'];

  function at(list, n) { return list[(n - 1) % list.length]; }
  function T(t, d, link) { return { t: t, d: d, link: link || null }; }

  // Content for stream `s` at position `n` (1-based)
  var STREAMS = {
    anki: { track: 'anki', carry: false, daily: true, f: function (n) {
      return n === 1 ? T('Abre Anki y repasa', 'Todas las pendientes. Las nuevas ya vienen limitadas a 15 por día.', LINKS.anki)
        : T('Repaso de Anki', 'Todas las tarjetas pendientes, más las nuevas del día.'); } },
    arLec: { track: 'arLec', carry: true, f: function (n) {
      if (n <= AR_ALF.length) { var a = AR_ALF[n - 1]; return T(a[0], a[1]); }
      var k = n - AR_ALF.length;
      if (k % 6 === 0) return T('Repaso de la semana', 'Rehaz en LingoDeer las últimas lecciones y escribe 10 frases de memoria.');
      var tema = AR_TEMAS[Math.min(Math.floor((k - 1) * AR_TEMAS.length / 140), AR_TEMAS.length - 1)];
      return T('LingoDeer Árabe: siguiente lección', 'Tema del plan para estas semanas: ' + tema + '. Escribe a mano las palabras nuevas.'); } },
    arLT: { track: 'arOido', carry: true, f: function (n) {
      if (n <= 19) return T('Language Transfer árabe: pistas ' + (2 * n - 1) + ' y ' + (2 * n), 'Pausa cuando el profesor pregunta y responde en voz alta antes que el alumno.', LINKS.lt);
      return T('Árabe egipcio: video con subtítulos', 'Un video corto en dialecto egipcio. Repite en voz alta 3 frases y pásalas a Anki.'); } },
    arConv: { track: 'arConv', carry: false, f: function (n) {
      if (n <= AR_CONV.length) { var c = AR_CONV[n - 1]; return T('Conversación: ' + c[0].replace(/^Primera charla: /, ''), c[1], c[2]); }
      return T('Conversación libre en árabe', 'Intercambio en Tandem o Claude por voz. Usa las frases nuevas de la semana.', LINKS.tandem); } },
    arRep: { track: 'arLec', carry: false, daily: true, f: function (n) {
      return n <= 2 ? T(n === 1 ? 'Repaso semanal del alfabeto' : 'Repaso de las 28 letras', n === 1 ? 'Rehaz en LingoDeer las letras de la semana y escríbelas de memoria.' : 'Escribe el alfabeto completo de memoria y lee en voz alta tus tarjetas.')
        : T('Repaso semanal de árabe', 'Rehaz en LingoDeer las lecciones de la semana y lee en voz alta tus frases de Anki.'); } },
    arRS: { track: 'arOido', carry: false, f: function (n) {
      return T('Rosetta Stone Árabe (PC): siguiente lección', 'Inmersión con imágenes en árabe estándar. Escucha y repite en voz alta.'); } },
    deDuo: { track: 'deLec', carry: false, daily: true, f: function (n) {
      return T('Duolingo alemán: 2 lecciones', n === 1 ? 'Sigue tu curso desde el español donde vas. Pasa 3 frases a Anki.' : 'Sigue tu curso desde el español. Lee en voz alta cada frase nueva y pasa 3 a Anki.'); } },
    deNW: { track: 'deOido', carry: true, f: function (n) {
      return T('Nicos Weg: siguiente episodio (' + n + '.º del plan)', 'Curso en video gratis de DW: empieza en A1 y pasa a A2 al terminarlo. Repite en voz alta 3 frases.', LINKS.dw); } },
    deConv: { track: 'deConv', carry: false, f: function (n) {
      if (n <= DE_CONV.length) { var c = DE_CONV[n - 1]; return T('Conversación: ' + c[0].replace(/^Primera charla: /, ''), c[1], c[2]); }
      return T('Conversación libre en alemán', 'Intercambio en Tandem o Claude por voz, 25 minutos.', LINKS.tandem); } },
    deSab: { track: 'deLec', carry: false, f: function (n) { var s = at(DE_SAB, n); return T(s[0], s[1]); } },
    deSerie: { track: 'deOido', carry: false, daily: true, f: function () {
      return T('Video en alemán', 'Easy German o un episodio extra de Nicos Weg, con subtítulos en alemán.'); } },
    enL: { track: 'en', carry: false, f: function () {
      return T('Escucha nativa + shadowing', '15 min de un podcast o charla nativa sin adaptar (BBC Radio 4, TED). Luego 5 min repitiendo un fragmento con su ritmo y entonación. Anota 5 expresiones.'); } },
    enW: { track: 'en', carry: false, f: function (n) {
      return T('Escritura corregida: 200–250 palabras', 'Tema: «' + at(EN_W, n) + '». Pídele a Claude que marque errores y frases poco naturales, reescribe el texto y anota los errores en tu registro.'); } },
    enR: { track: 'en', carry: false, f: function () {
      return T('Lectura larga + colocaciones', 'Un artículo largo de The Guardian o similar. Pasa 8 colocaciones o expresiones a Anki como frase completa.'); } },
    enS: { track: 'en', carry: false, f: function (n) {
      return T('Debate con Claude por voz', 'Tema: «' + at(EN_S, n) + '». 15 min defendiendo tu postura; al final pídele tus 3 errores más repetidos y anótalos en tu registro.'); } },
    enE: { track: 'en', carry: false, f: function (n) {
      return T('Registro de errores + gramática avanzada', 'Escribe la versión correcta de cada error de la semana. Luego 10 min de ' + at(EN_G, n) + '.'); } },
    enSab: { track: 'en', carry: false, f: function (n) {
      if (n === 1) return T('Mide tu nivel: EF SET', 'Test gratis de unos 50 minutos con resultado en escala A1–C2. Anota el resultado en la nota del día.', LINKS.efset);
      if (n % 12 === 0) return T('Mide tu avance: EF SET', 'Repite el test y compáralo con tu resultado anterior.', LINKS.efset);
      return T('Película o documental sin subtítulos', '40 min. Anota 5 expresiones que tú no usarías y pásalas a Anki.'); } },
    frLec: { track: 'frLec', carry: true, f: function (n) {
      return T('Francés: Duolingo o LingoDeer', 'Siguiente lección. Tema del plan: ' + FR_TEMAS[Math.min(Math.floor((n - 1) / 6), FR_TEMAS.length - 1)] + '. Cuidado con los falsos amigos del español.'); } },
    frLT: { track: 'frOido', carry: true, f: function (n) {
      return T('Francés en audio: Language Transfer o Easy French', 'Siguiente pista de Language Transfer francés, o un video de Easy French con subtítulos.', LINKS.lt); } },
    rev: { track: 'rev', carry: false, daily: true, f: function () {
      return T('Revisión semanal', 'Mira tu resumen semanal en la app: qué completaste y qué quedó pendiente. Repasa los errores de la semana.'); } },
    grab: { track: 'rev', carry: false, daily: true, f: function () {
      return T('Grábate 3 minutos', 'Primer día del mes: graba 3 minutos hablando en inglés y lo que puedas en alemán y árabe. Compáralo con la grabación del mes anterior.'); } }
  };

  var TRACKS = [
    { k: 'anki', label: 'Anki', lang: 'gen' },
    { k: 'arLec', label: 'Árabe · lección', lang: 'ar' },
    { k: 'arOido', label: 'Árabe · oído', lang: 'ar' },
    { k: 'arConv', label: 'Árabe · conversación', lang: 'ar' },
    { k: 'deLec', label: 'Alemán · lección', lang: 'de' },
    { k: 'deOido', label: 'Alemán · oído', lang: 'de' },
    { k: 'deConv', label: 'Alemán · conversación', lang: 'de' },
    { k: 'en', label: 'Inglés · C1 a C2', lang: 'en' },
    { k: 'frLec', label: 'Francés · lección', lang: 'fr' },
    { k: 'frOido', label: 'Francés · oído', lang: 'fr' },
    { k: 'rev', label: 'Revisión', lang: 'gen' }
  ];
  var LANGS = { ar: 'Árabe', de: 'Alemán', en: 'Inglés', fr: 'Francés', gen: 'General' };

  // ---------- Dates (local calendar, no time zones) ----------
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
  function addDays(s, n) { var d = parseISO(s); return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 864e5); }
  function weekday(s) { return parseISO(s).getDay(); }

  // Slots for a date: [stream, minutes]
  function slotsFor(dateISO, startISO) {
    var w = weekday(dateISO), week = Math.floor(Math.max(0, diffDays(startISO, dateISO)) / 7) + 1;
    var french = week >= 35; // mes 9
    var s = [];
    if (w >= 1 && w <= 5) {
      s.push(['anki', 10], ['arLec', 20]);
      s.push((w === 2 || w === 4) ? ['arConv', 15] : ['arLT', 15]);
      if (w === 3) s.push(['deConv', french ? 15 : 25]);
      else if (french) s.push(['deDuo', 5], ['deNW', 10]);
      else s.push(['deDuo', 10], ['deNW', 15]);
      var en = ['enL', 'enW', 'enR', 'enS', 'enE'][w - 1];
      s.push([en, french ? 10 : 20]);
      if (french) s.push(['frLec', 10], ['frLT', 10]);
    } else if (w === 6) {
      s.push(['anki', 10], ['arRep', 20], ['arRS', 20], ['deSab', 20], ['deSerie', 20], ['enSab', 40]);
      if (french) s.push(['frLT', 20]);
    } else {
      s.push(['anki', 10], ['rev', 20]);
    }
    if (parseISO(dateISO).getDate() === 1) s.push(['grab', 5]);
    return s;
  }

  /* Sequential plan: each non-daily stream is a queue of lessons (n = 1, 2, 3…).
     The next lesson of a stream unlocks only when the previous one is done. */
  function schedule(startISO, untilISO) {
    // dates on which each stream is scheduled, from start to untilISO (inclusive)
    var dates = {}, f = startISO, guard = 0;
    while (f <= untilISO && guard < 2000) {
      slotsFor(f, startISO).forEach(function (sl) { (dates[sl[0]] = dates[sl[0]] || []).push(f); });
      f = addDays(f, 1); guard++;
    }
    return dates;
  }

  /* Build days [fromISO .. fromISO+count-1].
     history: days already stored (array of {fecha, tareas:[{id,stream,n,min,done,...}]}).
     keep: set of fechas in range that must not be regenerated (they already have progress).
     todayISO: items in days before today that are still undone are carried forward. */
  function generate(opts) {
    var start = opts.start, history = opts.history || [], fromISO = opts.from, count = opts.count, todayISO = opts.today;
    var byDate = {}; history.forEach(function (d) { byDate[d.fecha] = d; });
    var cursor = {}, doneSet = {}, assigned = [];
    history.forEach(function (d) {
      (d.tareas || []).forEach(function (t) {
        if (!t.stream || !t.n) return;
        var key = t.stream + '#' + t.n;
        if (t.done) doneSet[key] = true;
        var keep = d.fecha < fromISO || (opts.keep && opts.keep[d.fecha]);
        if (keep) {
          cursor[t.stream] = Math.max(cursor[t.stream] || 0, t.n);
          if (d.fecha < todayISO) assigned.push({ key: key, stream: t.stream, n: t.n });
        }
      });
    });
    // pending: carried streams, assigned before today, never done anywhere
    var pending = {}, seen = {};
    assigned.sort(function (a, b) { return a.n - b.n; }).forEach(function (a) {
      if (!STREAMS[a.stream] || !STREAMS[a.stream].carry || doneSet[a.key] || seen[a.key]) return;
      seen[a.key] = true; (pending[a.stream] = pending[a.stream] || []).push(a.n);
    });
    // also don't re-pend items already placed in kept future days
    history.forEach(function (d) {
      if (d.fecha >= fromISO && opts.keep && opts.keep[d.fecha]) (d.tareas || []).forEach(function (t) {
        var p = pending[t.stream]; if (p) { var i = p.indexOf(t.n); if (i >= 0 && d.fecha >= todayISO) p.splice(i, 1); }
      });
    });

    var out = [];
    for (var i = 0; i < count; i++) {
      var f = addDays(fromISO, i);
      if (opts.keep && opts.keep[f] && byDate[f]) { out.push(byDate[f]); continue; }
      var tareas = [];
      slotsFor(f, start).forEach(function (slot, j) {
        var st = slot[0], def = STREAMS[st], n, carried = false;
        if (def.carry && pending[st] && pending[st].length) { n = pending[st].shift(); carried = true; }
        else { n = (cursor[st] || 0) + 1; cursor[st] = n; }
        var c = def.f(n);
        tareas.push({ id: st + '-' + n + '-' + j, stream: st, n: n, track: def.track, min: slot[1], t: c.t, d: c.d, link: c.link, carried: carried, done: false });
      });
      out.push({ fecha: f, tareas: tareas, nota: (byDate[f] && byDate[f].nota) || '' });
    }
    return out;
  }

  global.Curriculum = {
    TRACKS: TRACKS, LANGS: LANGS, STREAMS: STREAMS, generate: generate, slotsFor: slotsFor, schedule: schedule,
    date: { parseISO: parseISO, iso: iso, addDays: addDays, diffDays: diffDays, weekday: weekday },
    langOf: function (track) { for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].k === track) return TRACKS[i].lang; return 'gen'; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
