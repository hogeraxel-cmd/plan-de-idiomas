/* Plan de idiomas — currículo y generador de días.
   Cada bloque del día sale de un "flujo" (stream). Los flujos marcados como carry
   repiten primero lo que quedó pendiente en días pasados; los demás avanzan siempre. */
(function (global) {
  'use strict';

  var LINKS = {
    lt: { u: 'https://www.languagetransfer.org/courses', l: 'languagetransfer.org' },
    anki: { u: 'https://ankiweb.net/', l: 'ankiweb.net' },
    efset: { u: 'https://efset.org/ef-set-50', l: 'efset.org' }
  };

  // ---------- Árabe ----------
  // Semana 1: el alfabeto, 4 letras por lección, en el mismo orden que el mazo «Árabe» de Anki.
  var LETRAS = [
    [['ا', 'alif', 'una «a» larga; también sirve de soporte para otras vocales'], ['ب', 'ba', 'b'], ['ت', 'ta', 't'], ['ث', 'za', 'como la «z» de España o la «th» de «think»']],
    [['ج', 'yim', '«y» fuerte (en Egipto suena como la «g» de «gato»)'], ['ح', 'ja', 'una «h» echando aire fuerte desde la garganta, sin raspar'], ['خ', 'jaa', 'la «j» española de «jamón», raspando'], ['د', 'dal', 'd']],
    [['ذ', 'zal', 'como la «th» de «this» (lengua entre los dientes)'], ['ر', 'ra', 'r de «pero»'], ['ز', 'zay', 'una «z» que zumba, como una abeja: zzz'], ['س', 'sin', 's']],
    [['ش', 'shin', '«sh» de «show»'], ['ص', 'sad', 'una «s» gruesa: lengua abajo, sonido más oscuro'], ['ض', 'dad', 'una «d» gruesa'], ['ط', 'ta gruesa', 'una «t» gruesa']],
    [['ظ', 'za gruesa', 'una «z» de «this» gruesa'], ['ع', 'ain', 'apretando la garganta, como al levantar algo pesado; no existe en español'], ['غ', 'gain', 'una «g» gargareada, como la «r» francesa'], ['ف', 'fa', 'f']],
    [['ق', 'qaf', 'una «k» desde el fondo de la garganta (en Egipto, un corte de voz)'], ['ك', 'kaf', 'k'], ['ل', 'lam', 'l'], ['م', 'mim', 'm']],
    [['ن', 'nun', 'n'], ['ه', 'ha', 'una «h» suave, como en «hello»'], ['و', 'uau', '«w», o una «u» larga'], ['ي', 'ya', '«y», o una «i» larga']]
  ];
  var TODAS = [].concat.apply([], LETRAS);
  function cortas(g) { return '[' + g.map(function (l) { return l[0]; }).join(' ') + ']'; }

  // Semana 2: aprender a leer. [t, lección, cuaderno]
  var AR_LEER = [
    ['Vocales cortas: fatha, kasra y damma',
      'Son rayitas sobre o bajo la letra: fatha ( َ ) arriba = a; kasra ( ِ ) abajo = i; damma ( ُ ) arriba = u. Haz en LingoDeer la lección de vocales cortas, justo después del alfabeto.',
      'Lee en voz alta: [بَ] ba, [بِ] bi, [بُ] bu, [تَ] ta, [تِ] ti, [تُ] tu. Escribe 2 letras de la semana pasada con cada vocal.'],
    ['Vocales largas: [ا و ي]',
      '[ا] alarga la «a», [ي] alarga la «i» y [و] alarga la «u». Haz en LingoDeer la lección de vocales largas.',
      'Lee: [بَا] baa, [بِي] bii, [بُو] buu, [نَا] naa, [لِي] lii. Escribe 5 sílabas largas inventadas.'],
    ['Cómo se unen las letras',
      'Casi todas las letras cambian un poco según vayan al inicio, en medio o al final. Seis no se unen con la siguiente: [ا د ذ ر ز و]. Haz en LingoDeer la lección de formas de las letras.',
      'Copia y lee: [بَاب] baab (puerta), [كَلْب] kalb (perro), [وَرْد] ward (rosas). Marca con un círculo las letras que no se unen.'],
    ['Sukun y shadda',
      'Sukun ( ْ ) = la letra va sin vocal. Shadda ( ّ ) = la letra se pronuncia doble. Sigue en LingoDeer con la próxima lección.',
      'Lee: [بِنْت] bint (niña), [أُمّ] umm (mamá), [قِطّ] qitt (gato). Escribe cada palabra 3 veces.'],
    ['[ة] (ta marbuta) y [ال] (al-)',
      '[ة] va al final de muchas palabras femeninas y suena «a». [ال] al inicio significa «el/la». Sigue en LingoDeer con la próxima lección.',
      'Lee: [مَدْرَسَة] madrasa (colegio), [الْبَيْت] al-bayt (la casa). Escribe tu nombre: [أَكْسِل] Axel.'],
    ['Autoexamen de lectura',
      'Sin LingoDeer hoy: abre tus tarjetas de Anki del alfabeto en el navegador de mazos y lee en voz alta todas las letras con sus 3 vocales cortas (ba, bi, bu…).',
      'Escribe 10 palabras de esta semana sin mirar. Revisa con tus apuntes y repite 3 veces las que fallaste.'],
    ['Primeros saludos',
      'Ya puedes leer. Haz en LingoDeer la primera lección después del alfabeto (saludos). No importa ir lento: lee cada palabra en voz alta.',
      'Escribe y lee: [مَرْحَبًا] marhaban (hola), [شُكْرًا] shukran (gracias), [أَنَا أَكْسِل] ana Axel (soy Axel).']
  ];
  var AR_TEMAS = [
    'pronombres personales (ana, inta, inti…)', 'oraciones sin verbo «ser»', 'masculino y femenino', 'el artículo al- y las letras solares',
    'posesivos (mi, tu, su)', 'números del 1 al 10', 'la familia', 'comida y bebida', 'números del 11 al 100 y precios',
    'adjetivos y concordancia', 'lugares de la ciudad', 'preguntas: qué, dónde, cuándo, cómo', 'la hora y los días de la semana',
    'verbos en presente (1)', 'verbos en presente (2)', 'negación', 'el trabajo y las profesiones', 'rutina diaria',
    'colores y ropa', 'el plural', 'verbos en pasado (1)', 'verbos en pasado (2)', 'planes con «voy a»', 'viajes y transporte',
    'el cuerpo y la salud', 'comparativos', 'el clima', 'gustos y opiniones'
  ];
  var NL = LETRAS.length, NR = AR_LEER.length; // 7 + 7 lecciones antes de LingoDeer libre
  function arLec(n) {
    if (n <= NL) {
      var g = LETRAS[n - 1], pre = n === 1 ? 'Primero, en Anki: engranaje del mazo «Árabe» → Opciones → Nuevas tarjetas/día → 4 → Guardar. Así Anki te muestra cada día justo las 4 letras de la lección. ' : '';
      var o = T('Aprende 4 letras: ' + cortas(g), pre + 'Mira la guía de abajo: letra, nombre y cómo suena. Luego abre LingoDeer → Árabe → alfabeto y haz la lección donde aparecen estas letras: escucha cada audio y repítelo en voz alta. Si LingoDeer las agrupa distinto, avanza hasta haberlas visto todas.');
      o.g = g; return o;
    }
    if (n <= NL + NR) {
      var r = AR_LEER[n - NL - 1];
      var pre2 = n === NL + 1 ? 'Primero, en Anki: mazo «Árabe» → Opciones → Nuevas tarjetas/día → 0. Ya viste las 28 letras y así no aparecen frases que aún no estudias; las letras se siguen repasando solas. ' : '';
      return T(r[0], pre2 + r[1]);
    }
    var k = n - NL - NR;
    var pre3 = k === 1 ? 'Primero, en Anki: mazo «Árabe» → Opciones → Nuevas tarjetas/día → 3. Desde hoy entran frases egipcias simples; ya puedes leerlas. ' : '';
    if (k % 6 === 0) return T('Repaso de la semana', 'Rehaz en LingoDeer las últimas lecciones y lee en voz alta las palabras de tu cuaderno.');
    var tema = AR_TEMAS[Math.min(Math.floor((k - 1) * AR_TEMAS.length / 140), AR_TEMAS.length - 1)];
    return T('LingoDeer Árabe: siguiente lección', pre3 + 'Haz la siguiente lección del curso. Tema de estas semanas: ' + tema + '.');
  }
  function arEsc(n) {
    if (n <= NL) {
      var g = LETRAS[n - 1];
      if (n === NL) { var o = T('Cuaderno: las 28 letras', 'Escribe las letras de hoy 5 veces cada una. Luego tapa la guía y escribe el alfabeto completo de memoria, diciendo el sonido de cada letra. Revisa con la guía y repite las que olvidaste.'); o.g = TODAS; return o; }
      return T('Cuaderno: escribe ' + cortas(g), 'Escribe cada letra 5 veces, de derecha a izquierda, diciendo en voz alta su nombre y su sonido. Después tapa la guía y di el sonido de todas las letras que llevas.');
    }
    if (n <= NL + NR) { var r = AR_LEER[n - NL - 1]; return T('Cuaderno: lee y escribe', r[2]); }
    return T('Cuaderno: palabras de la lección', 'Escribe a mano las palabras nuevas de la lección de LingoDeer de hoy y léelas en voz alta 3 veces.');
  }
  var AR_CONV = [
    ['Saludos', 'Modo de voz de Claude: «Practica conmigo saludos en árabe egipcio. Habla lento y dime cómo se escribe cada frase».'],
    ['Presentarte', 'Con Claude por voz: tu nombre, de dónde eres y a qué te dedicas. Pasa 3 frases a Anki.'],
    ['Números y preguntas', 'Números del 1 al 10, «¿cómo estás?» y «¿de dónde eres?».'],
    ['Tu familia', 'Describe a tu familia con frases simples: cuántos son y cómo se llaman.'],
    ['Pedir comida', 'Simula un pedido en un restaurante: pedir, preguntar el precio, pagar.'],
    ['Tu trabajo', 'Explica en qué trabajas. Pide las palabras que te falten y pásalas a Anki.'],
    ['De compras', 'Pregunta precios y usa números grandes.'],
    ['Tu día', 'Cuenta tu rutina de un día normal.']
  ];

  // ---------- Alemán ----------
  var DE_FRASES = [
    ['«Ich heiße…», «Ich komme aus…»', 'Ich heiße Axel (me llamo Axel). Ich komme aus Chile (soy de Chile). Ich wohne in Santiago (vivo en Santiago). «ch» en «ich» suena como una «j» muy suave; «ei» suena «ai»; «w» suena «v».'],
    ['«Ich bin…» y «du bist…»', 'Ich bin müde (estoy cansado). Ich bin Vater (soy papá). Du bist nett (eres simpático). Cambia la última palabra por otras que sepas.'],
    ['«Ich habe…»', 'Ich habe einen Sohn (tengo un hijo). Ich habe eine Tochter (tengo una hija). Ich habe ein Auto (tengo un auto). einen = masculino, eine = femenino, ein = neutro.'],
    ['«Ich mag…» / «Ich mag … nicht»', 'Ich mag Kaffee (me gusta el café). Ich mag Musik. Ich mag Regen nicht (no me gusta la lluvia). nicht va al final.'],
    ['«Ich trinke…», «Ich esse…»', 'Ich trinke Wasser (tomo agua). Ich esse Brot (como pan). Ich trinke keinen Kaffee (no tomo café).'],
    ['Repaso de la semana', 'Di sin mirar una frase de cada tipo: Ich heiße…, Ich bin…, Ich habe…, Ich mag…, Ich trinke…'],
    ['«Das ist…»', 'Das ist mein Haus (esta es mi casa). Das ist mein Sohn (este es mi hijo). Das ist nicht gut (eso no está bien).'],
    ['«Ich möchte…, bitte»', 'Ich möchte einen Kaffee, bitte (quisiera un café, por favor). Ich möchte Wasser, bitte. Danke! (¡gracias!).'],
    ['Preguntas básicas', 'Wie heißt du? (¿cómo te llamas?). Woher kommst du? (¿de dónde eres?). Wo wohnst du? (¿dónde vives?). Pregunta y respóndete tú mismo.'],
    ['Números y tu edad', 'eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn. Luego: Ich bin … Jahre alt (tengo … años).'],
    ['Días de la semana', 'Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag. Heute ist Freitag (hoy es viernes). Morgen ist Samstag (mañana es sábado).'],
    ['Preséntate en 1 minuto', 'Junta todo: Hallo! Ich heiße Axel. Ich komme aus Chile. Ich wohne in Santiago. Ich bin … Jahre alt. Ich habe… Ich mag… Grábalo con el celular.'],
    ['«Ich kann…» / «Ich muss…»', 'Ich kann schwimmen (sé nadar). Ich muss arbeiten (tengo que trabajar). El segundo verbo va al final.'],
    ['«Ich gehe…» / «Ich fahre…»', 'Ich gehe nach Hause (voy a casa). Ich fahre mit dem Auto (voy en auto). Ich gehe ins Kino (voy al cine).'],
    ['La hora', 'Wie spät ist es? (¿qué hora es?) Es ist acht Uhr (son las ocho). Ich stehe um sieben Uhr auf (me levanto a las siete).'],
    ['Tu familia', 'Meine Frau heißt… Mein Sohn ist … Jahre alt. Meine Tochter mag… Describe a 3 personas.'],
    ['En la cafetería', 'Ich hätte gern… (me gustaría…). Was kostet das? (¿cuánto cuesta?). Die Rechnung, bitte (la cuenta, por favor).'],
    ['Repaso: tu rutina', 'Cuenta tu día con 5 frases: Ich stehe um … auf. Ich trinke… Ich arbeite… Ich esse… Ich schlafe um…']
  ];
  var DE_CONV = [
    ['Preséntate', 'Modo de voz de Claude: «Habla conmigo en alemán A1, lento, y corrígeme al final». Preséntate y responde sus preguntas.'],
    ['Tu familia', 'Meine Familie: quiénes son, cuántos años tienen, dónde viven.'],
    ['En la cafetería', 'Pide, pregunta el precio y paga: Ich möchte…, Was kostet…?'],
    ['Tu trabajo', 'Was machst du beruflich? Explica en qué trabajas.'],
    ['Tu rutina', 'Cuenta tu día con verbos separables (aufstehen, einkaufen…).'],
    ['Tus gustos', 'Ich mag… / Ich mag … nicht / gern.'],
    ['El fin de semana', 'Cuenta tu fin de semana en Perfekt (habe gemacht, bin gegangen).'],
    ['Direcciones', 'Wo ist…? Wie komme ich zu…?'],
    ['Planes', 'Qué harás el próximo fin de semana.'],
    ['Opiniones', 'Ich finde…, weil… — da tu opinión sobre un tema simple.']
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
  var ANKI_COMO = 'Una tarjeta nueva es la primera vez que la ves: es normal no saberla. Presiona Show Answer, lee y escucha, y marca Again si no la sabías.';
  var STREAMS = {
    arLec: { track: 'arLec', carry: true, f: arLec },
    arEsc: { track: 'arEsc', carry: true, f: arEsc },
    anki: { track: 'anki', carry: false, daily: true, f: function () {
      return T('Anki, después del árabe', 'Hazlo después de la lección de árabe: las tarjetas nuevas de árabe son lo que acabas de aprender. Si hoy no hiciste la lección de árabe, estudia solo los mazos «Alemán» e «Inglés». ' + ANKI_COMO, LINKS.anki); } },
    deDuo: { track: 'deDuo', carry: false, daily: true, f: function () {
      return T('Duolingo: 2 lecciones nuevas', 'Abre Duolingo → Alemán y avanza 2 lecciones en tu camino. Lee cada frase en voz alta antes de responder. Si fallas mucho en una, repítela antes de seguir.'); } },
    deDuoSab: { track: 'deDuo', carry: false, daily: true, f: function () {
      return T('Duolingo: repasa 2 lecciones', 'Abre Duolingo → Alemán y repite 2 lecciones que ya hiciste esta semana. Lee cada frase en voz alta antes de responder.'); } },
    deLD: { track: 'deLD', carry: true, f: function (n) {
      if (n % 6 === 0) return T('LingoDeer: repaso de la semana', 'LingoDeer → Alemán → abre las lecciones de esta semana y haz su repaso. Fíjate en el artículo (der, die, das) de cada palabra.');
      return T('LingoDeer: la siguiente lección', 'LingoDeer → Alemán → la siguiente lección de tu curso. Antes de los ejercicios lee las notas de gramática de la lección (Learning Tips): ahí está el «por qué» que Duolingo no explica.'); } },
    deHab: { track: 'deHab', carry: true, f: function (n) {
      var x = DE_FRASES[(n - 1) % DE_FRASES.length];
      return T('Dilo en voz alta: ' + x[0], x[1] + ' Léelas 3 veces en voz alta, luego dilas sin mirar y cambia una palabra para crear 1 frase tuya. Escríbela en la nota del día.'); } },
    deConv: { track: 'deConv', carry: false, f: function (n) {
      var c = at(DE_CONV, n); return T('Habla con Claude: ' + c[0], c[1] + ' 15 minutos. Pídele al final tus 3 errores y anótalos en la nota del día.'); } },
    arConv: { track: 'arConv', carry: false, f: function (n) {
      var c = at(AR_CONV, n); return T('Habla con Claude: ' + c[0], c[1]); } },
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
      return T('Película o documental sin subtítulos', '40 min. Anota 5 expresiones que tú no usarías y anótalas en la nota del día.'); } },
    frLec: { track: 'frLec', carry: true, f: function (n) {
      return T('Francés: Duolingo o LingoDeer', 'Siguiente lección. Tema del plan: ' + FR_TEMAS[Math.min(Math.floor((n - 1) / 6), FR_TEMAS.length - 1)] + '. Cuidado con los falsos amigos del español.'); } },
    frLT: { track: 'frOido', carry: true, f: function (n) {
      return T('Francés en audio: Language Transfer o Easy French', 'Siguiente pista de Language Transfer francés, o un video de Easy French con subtítulos.', LINKS.lt); } },
    rev: { track: 'rev', carry: false, daily: true, f: function (n) {
      if (n === 1) return T('Prepara tu semana', 'Abre Ajustes → Puesta a punto y revisa que Anki esté listo. Mira la pestaña Plan: cada día haces los bloques en el orden de la lista, con la lección de árabe siempre antes que Anki.');
      return T('Revisión semanal', '1) Mira en Resumen qué quedó pendiente: hazlo hoy o déjalo para la semana. 2) Lee tus notas de la semana. 3) Repasa tu cuaderno de árabe 5 minutos.'); } },
    grab: { track: 'rev', carry: false, daily: true, f: function (n) {
      if (n === 1) return T('Grábate 2 minutos (punto de partida)', 'Con la grabadora del celular: 1 min y medio en inglés contando qué hiciste esta semana, y 30 segundos en alemán diciendo «Hallo, ich heiße Axel» más las palabras que sepas. En árabe todavía no. Guarda el audio con la fecha para comparar el próximo mes.');
      return T('Grábate 3 minutos', 'Primer día del mes: 1 min en inglés, 1 min en alemán presentándote y contando tu día, y en árabe lee en voz alta 5 palabras o saludos que sepas. Compáralo con la grabación del mes anterior.'); } }
  };

  var TRACKS = [
    { k: 'arLec', label: 'Árabe · LingoDeer', lang: 'ar' },
    { k: 'arEsc', label: 'Árabe · cuaderno', lang: 'ar' },
    { k: 'arConv', label: 'Árabe · conversación', lang: 'ar' },
    { k: 'anki', label: 'Anki', lang: 'gen' },
    { k: 'deDuo', label: 'Alemán · Duolingo', lang: 'de' },
    { k: 'deLD', label: 'Alemán · LingoDeer', lang: 'de' },
    { k: 'deHab', label: 'Alemán · en voz alta', lang: 'de' },
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

  // Slots for a date: [stream, minutes], in the order you do them
  function slotsFor(dateISO, startISO) {
    var w = weekday(dateISO), week = Math.floor(Math.max(0, diffDays(startISO, dateISO)) / 7) + 1;
    var french = week >= 35; // mes 9
    var s = [['arLec', 15], ['arEsc', 10], ['anki', 10]];
    if (w === 4 && week >= 9) s.push(['arConv', 15]);        // conversación en árabe desde el mes 3
    if (w >= 1 && w <= 5) {
      s.push(['deDuo', french ? 5 : 10], ['deLD', french ? 10 : 15]);
      s.push(w === 3 && week >= 5 ? ['deConv', 15] : ['deHab', 5]); // conversación en alemán desde el mes 2
      s.push([['enL', 'enW', 'enR', 'enS', 'enE'][w - 1], french ? 10 : 20]);
      if (french) s.push(['frLec', 10], ['frLT', 10]);
    } else if (w === 6) {
      s.push(['deDuoSab', 10], ['deLD', 15], ['deHab', 5], ['enSab', 40]);
      if (french) s.push(['frLT', 20]);
    } else {
      s.push(['rev', 10]);
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
