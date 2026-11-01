import genanki, html

CSS = """
.card { font-family: 'Segoe UI', Arial, sans-serif; font-size: 22px; text-align: center; color: #15202b; background: #ffffff; }
.nightMode.card, .night_mode .card { color: #e6ebf0; background: #161c22; }
.ar { font-family: 'Noto Naskh Arabic', 'Arabic Typesetting', 'Traditional Arabic', 'Geeza Pro', serif; font-size: 64px; direction: rtl; line-height: 1.5; }
.ar-s { font-family: 'Noto Naskh Arabic', 'Arabic Typesetting', 'Traditional Arabic', 'Geeza Pro', serif; font-size: 40px; direction: rtl; }
.forms { font-family: 'Noto Naskh Arabic', 'Arabic Typesetting', 'Traditional Arabic', 'Geeza Pro', serif; font-size: 34px; direction: rtl; letter-spacing: 6px; }
.tr { font-size: 22px; color: #0d7666; font-weight: 600; }
.nightMode .tr, .night_mode .tr { color: #43c5ae; }
.note { font-size: 17px; color: #5a6775; margin-top: 10px; }
.nightMode .note, .night_mode .note { color: #98a5b2; }
.de { font-size: 30px; font-weight: 600; color: #b0601a; }
.nightMode .de, .night_mode .de { color: #e59d5b; }
.es { font-size: 26px; }
"""

# --- Árabe: alfabeto (letra -> nombre y sonido)
letter_model = genanki.Model(
    1607392319, 'Plan idiomas · Letra árabe',
    fields=[{'name': 'Letra'}, {'name': 'Formas'}, {'name': 'Nombre'}, {'name': 'Sonido'}],
    templates=[{
        'name': 'Letra → sonido',
        'qfmt': '<div class="ar">{{Letra}}</div><div class="note">¿Cómo se llama y cómo suena?</div>',
        'afmt': '{{FrontSide}}<hr id="answer"><div class="tr">{{Nombre}}</div><div class="note">{{Sonido}}</div><div class="forms">{{Formas}}</div><div class="note">formas: aislada · inicial · media · final (de derecha a izquierda)</div>',
    }],
    css=CSS)

# --- Frases (español -> idioma, y al revés)
phrase_ar_model = genanki.Model(
    1607392320, 'Plan idiomas · Frase árabe',
    fields=[{'name': 'Español'}, {'name': 'Árabe'}, {'name': 'Pronunciación'}, {'name': 'Nota'}],
    templates=[
        {'name': 'Español → árabe',
         'qfmt': '<div class="es">{{Español}}</div><div class="note">dilo en árabe egipcio</div>',
         'afmt': '{{FrontSide}}<hr id="answer"><div class="ar-s">{{Árabe}}</div><div class="tr">{{Pronunciación}}</div><div class="note">{{Nota}}</div>'},
        {'name': 'Árabe → español',
         'qfmt': '<div class="ar-s">{{Árabe}}</div><div class="tr">{{Pronunciación}}</div>',
         'afmt': '{{FrontSide}}<hr id="answer"><div class="es">{{Español}}</div><div class="note">{{Nota}}</div>'},
    ],
    css=CSS)

phrase_de_model = genanki.Model(
    1607392321, 'Plan idiomas · Frase alemana',
    fields=[{'name': 'Español'}, {'name': 'Alemán'}, {'name': 'Nota'}],
    templates=[
        {'name': 'Español → alemán',
         'qfmt': '<div class="es">{{Español}}</div><div class="note">dilo en alemán, en voz alta</div>',
         'afmt': '{{FrontSide}}<hr id="answer"><div class="de">{{Alemán}}</div><div class="note">{{Nota}}</div>'},
        {'name': 'Alemán → español',
         'qfmt': '<div class="de">{{Alemán}}</div>',
         'afmt': '{{FrontSide}}<hr id="answer"><div class="es">{{Español}}</div><div class="note">{{Nota}}</div>'},
    ],
    css=CSS)

T = 'ـ'  # tatweel
def forms(ch, joins=True):
    if joins:
        return f'{ch} {ch}{T} {T}{ch}{T} {T}{ch}'
    return f'{ch} {T}{ch}'

# (letra, nombre, sonido, se une, lección)
LETTERS = [
    ('ا', 'alif', '“a” o “aa” larga. No se une a la letra siguiente.', False, 'Alfabeto 1'),
    ('ب', 'baa’ (b)', 'b, como en “bota”.', True, 'Alfabeto 1'),
    ('ت', 'taa’ (t)', 't, como en “taza”.', True, 'Alfabeto 1'),
    ('ث', 'thaa’ (th)', 'th de “think” en estándar; en egipcio suele sonar “s” o “t”.', True, 'Alfabeto 1'),
    ('ج', 'jiim (j / g)', '“j” de “jam” en estándar; en egipcio suena “g” de “gato”.', True, 'Alfabeto 2'),
    ('ح', 'Haa’ (ḥ)', 'h fuerte desde la garganta, sin raspar. No existe en español.', True, 'Alfabeto 2'),
    ('خ', 'khaa’ (kh)', 'como la “j” española de “jamón”.', True, 'Alfabeto 2'),
    ('د', 'daal (d)', 'd, como en “dedo”. No se une a la siguiente.', False, 'Alfabeto 3'),
    ('ذ', 'dhaal (dh)', 'th de “this” en estándar; en egipcio suele sonar “z” o “d”. No se une.', False, 'Alfabeto 3'),
    ('ر', 'raa’ (r)', 'r simple, como en “pero”. No se une a la siguiente.', False, 'Alfabeto 3'),
    ('ز', 'zaay (z)', 'z sonora, como la “z” inglesa de “zoo”. No se une.', False, 'Alfabeto 3'),
    ('و', 'waaw (w / uu)', '“w” o “u” larga. No se une a la siguiente.', False, 'Alfabeto 3'),
    ('س', 'siin (s)', 's, como en “sol”.', True, 'Alfabeto 4'),
    ('ش', 'shiin (sh)', '“sh” de “show”.', True, 'Alfabeto 4'),
    ('ص', 'Saad (ṣ)', 's “gruesa”: la lengua baja y el sonido se oscurece.', True, 'Alfabeto 4'),
    ('ض', 'Daad (ḍ)', 'd “gruesa”, versión oscura de د.', True, 'Alfabeto 4'),
    ('ط', 'Taa’ (ṭ)', 't “gruesa”, versión oscura de ت.', True, 'Alfabeto 5'),
    ('ظ', 'Zaa’ (ẓ)', 'z o dh “gruesa”; en egipcio suele sonar como una z oscura.', True, 'Alfabeto 5'),
    ('ع', '‘ayn (‘)', 'contracción en la garganta, como un quejido corto. El sonido más nuevo para ti.', True, 'Alfabeto 5'),
    ('غ', 'ghayn (gh)', 'como la “r” francesa, una g gargarizada.', True, 'Alfabeto 5'),
    ('ف', 'faa’ (f)', 'f, como en “foca”.', True, 'Alfabeto 6'),
    ('ق', 'qaaf (q)', 'k profunda en estándar; en egipcio suele sonar como un corte en la garganta.', True, 'Alfabeto 6'),
    ('ك', 'kaaf (k)', 'k, como en “casa”.', True, 'Alfabeto 6'),
    ('ل', 'laam (l)', 'l, como en “luna”.', True, 'Alfabeto 6'),
    ('م', 'miim (m)', 'm, como en “mamá”.', True, 'Alfabeto 7'),
    ('ن', 'nuun (n)', 'n, como en “nube”.', True, 'Alfabeto 7'),
    ('ه', 'haa’ (h)', 'h suave aspirada, como la “h” inglesa de “hat”.', True, 'Alfabeto 7'),
    ('ي', 'yaa’ (y / ii)', '“y” o “i” larga.', True, 'Alfabeto 7'),
]

SIGNS = [
    ('بَ', 'fatha', 'rayita arriba: vocal corta “a”. Se lee “ba”.', 'Vocales'),
    ('بِ', 'kasra', 'rayita abajo: vocal corta “i”. Se lee “bi”.', 'Vocales'),
    ('بُ', 'damma', 'gancho arriba: vocal corta “u”. Se lee “bu”.', 'Vocales'),
    ('بْ', 'sukun', 'circulito arriba: sin vocal. Se lee solo “b”.', 'Vocales'),
    ('بّ', 'shadda', 'consonante doble: “bb”.', 'Vocales'),
    ('ة', 'taa’ marbuuTa', 'al final de palabra, casi siempre femenino; suena “a” (en egipcio).', 'Ta marbuta y hamza'),
    ('ء', 'hamza', 'corte de voz breve, como entre las dos “o” de “oh-oh”.', 'Ta marbuta y hamza'),
]

AR_PHRASES = [
    ('Hola (saludo general)', 'السلام عليكم', 'is-salaamu ‘aleekum', 'Respuesta: wa ‘aleekum is-salaam.', 'Conversación 1'),
    ('Buenos días', 'صباح الخير', 'SabaaH il-kheer', 'Respuesta: SabaaH in-nuur.', 'Conversación 1'),
    ('Buenas tardes / buenas noches (al llegar)', 'مساء الخير', 'masaa’ il-kheer', 'Respuesta: masaa’ in-nuur.', 'Conversación 1'),
    ('¿Cómo estás? (a un hombre)', 'إزيك؟', 'izzayyak?', 'A una mujer: izzayyik?', 'Conversación 1'),
    ('Estoy bien, gracias a Dios', 'كويس، الحمد لله', 'kwayyis, il-Hamdu lillaah', 'Una mujer dice: kwayyisa.', 'Conversación 1'),
    ('Gracias', 'شكراً', 'shukran', '', 'Conversación 1'),
    ('Chao / adiós', 'مع السلامة', 'ma‘a s-salaama', '', 'Conversación 1'),
    ('Me llamo…', 'اسمي…', 'ismi…', '', 'Conversación 3'),
    ('¿Cómo te llamas? (a un hombre)', 'اسمك إيه؟', 'ismak eeh?', 'A una mujer: ismik eeh?', 'Conversación 3'),
    ('Soy de Chile', 'أنا من تشيلي', 'ana min Chile', '', 'Conversación 3'),
    ('¿De dónde eres? (a un hombre)', 'انت منين؟', 'inta minein?', 'A una mujer: inti minein?', 'Conversación 4'),
    ('Mucho gusto', 'تشرفنا', 'itsharrafna', '', 'Conversación 3'),
    ('Sí / No', 'أيوه / لأ', 'aywa / la’', '', 'Conversación 4'),
    ('Por favor / disculpa (para pedir algo)', 'لو سمحت', 'law samaHt', 'A una mujer: law samaHti.', 'Conversación 4'),
    ('No entiendo', 'مش فاهم', 'mish faahim', 'Una mujer dice: mish fahma.', 'Conversación 4'),
]

DE_PHRASES = [
    ('Hola', 'Hallo', ''), ('Buenos días', 'Guten Morgen', 'Hasta media mañana.'),
    ('Buen día (saludo de la tarde)', 'Guten Tag', ''), ('Buenas noches (al llegar)', 'Guten Abend', ''),
    ('Chao', 'Tschüss', 'Informal.'), ('Adiós', 'Auf Wiedersehen', 'Formal.'),
    ('Gracias', 'Danke', ''), ('Por favor / de nada', 'Bitte', 'Sirve para las dos cosas.'),
    ('Disculpe / perdón', 'Entschuldigung', ''), ('Sí / No', 'Ja / Nein', ''),
    ('¿Cómo te llamas?', 'Wie heißt du?', 'Formal: Wie heißen Sie?'), ('Me llamo…', 'Ich heiße…', ''),
    ('¿De dónde eres?', 'Woher kommst du?', 'Formal: Woher kommen Sie?'), ('Soy de Chile', 'Ich komme aus Chile.', ''),
    ('¿Dónde vives?', 'Wo wohnst du?', ''), ('Vivo en…', 'Ich wohne in…', ''),
    ('¿Cómo estás?', 'Wie geht’s?', 'Formal: Wie geht es Ihnen?'), ('Bien, gracias. ¿Y tú?', 'Gut, danke. Und dir?', ''),
    ('No entiendo', 'Ich verstehe nicht.', ''), ('¿Puede repetirlo, por favor?', 'Können Sie das bitte wiederholen?', ''),
    ('¿Habla inglés?', 'Sprechen Sie Englisch?', ''), ('Estoy aprendiendo alemán', 'Ich lerne Deutsch.', ''),
    ('¿Qué es eso?', 'Was ist das?', ''), ('¿Cuánto cuesta?', 'Wie viel kostet das?', ''),
    ('Quisiera un café, por favor', 'Ich möchte einen Kaffee, bitte.', 'einen: Kaffee es masculino en acusativo.'),
    ('Tengo … años', 'Ich bin … Jahre alt.', 'En alemán se “es” la edad, no se “tiene”.'),
    ('¿En qué trabajas?', 'Was machst du beruflich?', ''), ('Trabajo como…', 'Ich arbeite als…', 'Sin artículo: Ich arbeite als Ingenieur.'),
    ('¿Qué hora es?', 'Wie spät ist es?', ''), ('Son las tres', 'Es ist drei Uhr.', ''),
    ('Números del 1 al 10', 'eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn', 'Dilos en orden y en voz alta.'),
    ('el hombre · la mujer · el niño', 'der Mann · die Frau · das Kind', 'der = masculino, die = femenino, das = neutro. Aprende cada sustantivo con su artículo.'),
]

root = 'Plan de idiomas'
deck_ar_alf = genanki.Deck(2059400110, f'{root}::Árabe::1 Alfabeto')
deck_ar_fr = genanki.Deck(2059400111, f'{root}::Árabe::2 Frases egipcias')
deck_de = genanki.Deck(2059400112, f'{root}::Alemán::Frases A1')
deck_en = genanki.Deck(2059400113, f'{root}::Inglés::Errores y colocaciones')

def tag(s): return s.replace(' ', '_')

for ch, name, sound, joins, lesson in LETTERS:
    deck_ar_alf.add_note(genanki.Note(model=letter_model,
        fields=[ch, forms(ch, joins), html.escape(name), html.escape(sound)],
        tags=['arabe', tag(lesson)], guid=genanki.guid_for('letra', ch)))
for ch, name, sound, lesson in SIGNS:
    deck_ar_alf.add_note(genanki.Note(model=letter_model,
        fields=[ch, ch, html.escape(name), html.escape(sound)],
        tags=['arabe', tag(lesson)], guid=genanki.guid_for('signo', ch)))
for es, ar, pr, note, lesson in AR_PHRASES:
    deck_ar_fr.add_note(genanki.Note(model=phrase_ar_model,
        fields=[html.escape(es), ar, html.escape(pr), html.escape(note)],
        tags=['arabe', 'egipcio', tag(lesson)], guid=genanki.guid_for('ar', es)))
for es, de, note in DE_PHRASES:
    deck_de.add_note(genanki.Note(model=phrase_de_model,
        fields=[html.escape(es), html.escape(de), html.escape(note)],
        tags=['aleman', 'A1'], guid=genanki.guid_for('de', es)))

# One example card in the English deck so the deck exists; replace it with your own
en_model = genanki.Model(
    1607392322, 'Plan idiomas · Inglés',
    fields=[{'name': 'Frente'}, {'name': 'Reverso'}],
    templates=[{'name': 'Tarjeta', 'qfmt': '<div class="es">{{Frente}}</div>',
                'afmt': '{{FrontSide}}<hr id="answer"><div class="es">{{Reverso}}</div>'}],
    css=CSS)
deck_en.add_note(genanki.Note(model=en_model,
    fields=['Ejemplo · corrige: “I am agree with you.”',
            '<b>I agree with you.</b><div class="note">Así se ven tus tarjetas de inglés: tu error al frente y la versión correcta atrás. Borra esta cuando agregues las tuyas.</div>'],
    tags=['ingles', 'ejemplo'], guid=genanki.guid_for('en', 'ejemplo')))

import os
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Plan de idiomas - mazo inicial.apkg')
genanki.Package([deck_ar_alf, deck_ar_fr, deck_de, deck_en]).write_to_file(out)
n = sum(len(d.notes) for d in [deck_ar_alf, deck_ar_fr, deck_de, deck_en])
print('notes', n, 'cards approx', len(LETTERS)+len(SIGNS)+2*len(AR_PHRASES)+2*len(DE_PHRASES)+1)
