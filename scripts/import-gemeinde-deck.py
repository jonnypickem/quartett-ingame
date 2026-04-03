#!/usr/bin/env python3
import csv
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = Path('/Users/jonny/Downloads/Gemeinde_Quartett_korrigiert.csv')
IMG_DIR = Path('/Users/jonny/Downloads/Gemeinde Quartett Bilder')
MANIFEST_PATH = ROOT / 'content' / 'decks' / 'content-manifest.json'
OUT_DIR = ROOT / 'public' / 'decks' / 'gemeinde-quartett-v1'

DECK_ID = 'gemeinde-quartett-v1'
DECK_NAME = 'Gemeinde Quartett'
DECK_DESCRIPTION = 'Menschen aus der Gemeinde als verstecktes Sonderdeck.'
ACCESS_CODE = '162026'
SOURCE_URL = 'local:/Users/jonny/Downloads/Gemeinde_Quartett_korrigiert.csv'
CANVAS_SIZE = (1200, 675)
BG_HEX = '#CBCBCB'

NAME_IMAGE_ALIASES = {
    'Barbelies': 'Babelise',
    'Salo': 'Salome',
    'Hans Müller': 'Hans',
    'Robi': 'Robert',
    'Freddi': 'Freddy'
}

HANNAH_ROW = {
    'Name': 'Hannah',
    'Anzahl an Kindern': '0',
    'Alter': '18',
    'Anzahl an Diensten': '2',
    'Distanz zur Gemeinde': '0,81km',
    'Anwesenheit Gebetsstunde (%)': '50%',
    'Technische Kompetenz (%)': '65%',
    'SQ Wert (Cent)': '15',
    'Gastfreundschaft (%)': '13%'
}


def parse_int(raw: str) -> int:
    return int(str(raw).strip())


def parse_percent(raw: str) -> int:
    val = str(raw).strip().replace('%', '').replace(',', '.')
    return int(round(float(val)))


def parse_km(raw: str) -> float:
    val = str(raw).strip().lower().replace('km', '').replace(',', '.').strip()
    return float(val)


def load_rows():
    with CSV_PATH.open('r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f, delimiter=';')
        rows = [row for row in reader]

    rows.append(HANNAH_ROW)
    if len(rows) != 32:
        raise ValueError(f'Expected 32 rows after Hannah append, got {len(rows)}')
    return rows


def resolve_image_path(name: str) -> Path:
    image_stem = NAME_IMAGE_ALIASES.get(name, name)
    candidate = IMG_DIR / f'{image_stem}.PNG'
    if not candidate.exists():
        raise FileNotFoundError(f'Missing image for {name}: {candidate}')
    return candidate


def fit_on_canvas(img: Image.Image, canvas_size, bg_hex: str) -> Image.Image:
    rgb = tuple(int(bg_hex[i:i + 2], 16) for i in (1, 3, 5))
    canvas = Image.new('RGB', canvas_size, rgb)

    src = img.convert('RGBA')
    sw, sh = src.size
    cw, ch = canvas_size

    scale = min(cw / sw, ch / sh)
    nw = max(1, int(sw * scale))
    nh = max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)

    x = (cw - nw) // 2
    y = (ch - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def card_specs(row):
    children = parse_int(row['Anzahl an Kindern'])
    age = parse_int(row['Alter'])
    services = parse_int(row['Anzahl an Diensten'])
    distance = parse_km(row['Distanz zur Gemeinde'])
    prayer = parse_percent(row['Anwesenheit Gebetsstunde (%)'])
    technical = parse_percent(row['Technische Kompetenz (%)'])
    sq = parse_int(row['SQ Wert (Cent)'])
    hospitality = parse_percent(row['Gastfreundschaft (%)'])

    return [
        {'key': 'children_count', 'label': 'Kinder', 'unit': 'count', 'caption': 'Anzahl Kinder', 'value': children, 'icon': 'children', 'sourceUrl': SOURCE_URL},
        {'key': 'age_years', 'label': 'Alter', 'unit': 'years', 'caption': 'Lebensjahre', 'value': age, 'icon': 'age', 'sourceUrl': SOURCE_URL},
        {'key': 'service_count', 'label': 'Dienste', 'unit': 'count', 'caption': 'Anzahl Dienste', 'value': services, 'icon': 'services', 'sourceUrl': SOURCE_URL},
        {'key': 'distance_km', 'label': 'Distanz', 'unit': 'km', 'caption': 'Zur Gemeinde', 'value': distance, 'icon': 'distance', 'sourceUrl': SOURCE_URL, 'displayPrecision': 2},
        {'key': 'prayer_attendance_pct', 'label': 'Gebetsstunde', 'unit': '%', 'caption': 'Anwesenheit', 'value': prayer, 'icon': 'prayer', 'sourceUrl': SOURCE_URL},
        {'key': 'technical_competence_pct', 'label': 'Technik', 'unit': '%', 'caption': 'Kompetenz', 'value': technical, 'icon': 'technical', 'sourceUrl': SOURCE_URL},
        {'key': 'sq_value_cent', 'label': 'SQ Wert', 'unit': 'cent', 'caption': 'Singen', 'value': sq, 'icon': 'money', 'sourceUrl': SOURCE_URL},
        {'key': 'hospitality_pct', 'label': 'Gastfreundschaft', 'unit': '%', 'caption': 'Herzlichkeit', 'value': hospitality, 'icon': 'hospitality', 'sourceUrl': SOURCE_URL},
    ]


def main():
    rows = load_rows()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    cards = []
    for idx, row in enumerate(rows, start=1):
        code = f'{idx:02d}'
        name = row['Name'].strip()

        src_path = resolve_image_path(name)
        with Image.open(src_path) as src:
            composed = fit_on_canvas(src, CANVAS_SIZE, BG_HEX)
            out_path = OUT_DIR / f'{code}.jpg'
            composed.save(out_path, format='JPEG', quality=92, optimize=True)

        cards.append({
            'code': code,
            'name': name,
            'localImageUrl': f'/decks/{DECK_ID}/{code}.jpg',
            'specs': card_specs(row),
            'source': {
                'csvName': row['Name'],
                'imageFile': src_path.name,
                'backgroundHex': BG_HEX,
                'csvPath': str(CSV_PATH)
            }
        })

    with MANIFEST_PATH.open('r', encoding='utf-8') as f:
        manifest = json.load(f)

    decks = manifest.get('decks', [])
    decks = [d for d in decks if d.get('id') != DECK_ID]
    decks.append({
        'id': DECK_ID,
        'name': DECK_NAME,
        'description': DECK_DESCRIPTION,
        'isHidden': True,
        'accessCode': ACCESS_CODE,
        'idPrefix': 'gemeinde',
        'cards': cards
    })

    manifest['decks'] = decks

    with MANIFEST_PATH.open('w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f'Imported {len(cards)} cards into {DECK_ID}')


if __name__ == '__main__':
    main()
