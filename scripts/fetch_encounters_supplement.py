#!/usr/bin/env python3
"""Supplement the encounters bundle with sources PokéAPI lacks.

Covers:
- Pokémon Scarlet / Violet  (Paldea)   — Serebii Pokearth spawntables
- Pokémon Legends: Arceus   (Hisui)    — Serebii Pokearth spawntables
- Brilliant Diamond / Sh. Pearl — derived from the DPPt bundle data
  (BDSP is a faithful remake; Grand Underground differences not modeled).
- Ultra Sun / Ultra Moon        — derived from the SM bundle data
  (covers shared routes; USUM-exclusive areas not modeled).
Colosseum / XD are skipped: their encounters are scripted snag battles.

Run: python3 scripts/fetch_encounters_supplement.py
"""
import json, os, re, time, urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

ROOT = __file__.rsplit('/scripts/', 1)[0]
BUNDLE = ROOT + '/public/data/encounters.json'
UA = {'User-Agent': 'Dex144-encounter-sync'}

def fetch(url, retries=3, cache_dir=None):
    if cache_dir:
        os.makedirs(cache_dir, exist_ok=True)
        import hashlib
        cf = os.path.join(cache_dir, hashlib.md5(url.encode()).hexdigest() + '.html')
        if os.path.exists(cf) and os.path.getsize(cf) > 0:
            with open(cf) as f:
                return f.read()
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read().decode('latin-1')
                if cache_dir:
                    with open(cf, 'w') as f:
                        f.write(body)
                return body
        except Exception as e:
            if attempt == retries - 1:
                print(f'FAILED {url}: {e}')
                return ''
            time.sleep(0.5 * (attempt + 1) ** 2)

def rows_of(html):
    return re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.S)

def cells_of(row):
    return re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)

def strip_tags(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).strip()

# ──────────────────────────────────────────────────────────────────────
# Pokearth scraping
# ──────────────────────────────────────────────────────────────────────

def area_pages(region):
    html = fetch(f'https://www.serebii.net/pokearth/{region}/')
    pages = sorted(set(re.findall(r'/pokearth/%s/([a-z0-9-]+)\.shtml' % region, html)))
    return [p for p in pages if p != 'index']

def parse_pokefilter(html, key_divisor=1):
    """Species id → marker table ids, from the page's pokeFilter JS object.
    Anchored at 'pokeFilter = {' because other JS objects share the
    'tableIDs' shape (marker metadata with small numeric keys).
    Pokearth keys: Paldea uses speciesId*10+formIdx; Hisui/PLA uses raw speciesId."""
    out = {}
    start = re.search(r'pokeFilter\s*=\s*\{', html)
    if not start:
        return out
    start = start.end() - 1  # position of the opening brace
    end = html.find('};', start)
    body = html[start:end if end > 0 else len(html)]
    for m in re.finditer(r'\b(\d+):\s*\{\s*tableIDs:\s*\[([^\]]*)\]', body):
        sid = int(m.group(1)) // key_divisor
        ids = [int(x) for x in re.findall(r'\d+', m.group(2))]
        if ids:
            out.setdefault(sid, [])
            out[sid] = sorted(set(out[sid] + ids))
    return out

PLA_TIME = {'Morning': 'time-morning', 'Day': 'time-day', 'Evening': 'time-evening', 'Night': 'time-night'}
PLA_WEATHER = {'All Weather': 'weather-normal', 'Sunny': 'weather-intense-sun', 'Cloudy': 'weather-overcast',
               'Rain': 'weather-raining', 'Snow': 'weather-snowing', 'Drought': 'weather-drought',
               'Fog': 'weather-fog', 'Rainstorm': 'weather-rainstorm', 'Snowstorm': 'weather-snowstorm',
               'Sandstorm': 'weather-sandstorm'}

def parse_pla_txt(html, wanted_species):
    """Legends Arceus spawntable. Forward-scanning state machine: on a sprite
    row (all cells carry /legendsarceus/pokemon/small/N.png) collect the
    following rows until the level row, pulling Alpha flags, rate % and
    level ranges from whichever cells match."""
    out = []
    current_cond = []
    current_section = ''

    def classify(row_cells):
        kinds = []
        for c in row_cells:
            if '/legendsarceus/pokemon/small' in c:
                kinds.append('sprite')
            elif re.search(r'^\s*[\d.]+%\s*$', strip_tags(c)):
                kinds.append('rate')
            elif re.search(r'^\s*\d+\s*-\s*\d+\s*$', strip_tags(c)):
                kinds.append('level')
            elif 'alpha.png' in c:
                kinds.append('alpha')
            else:
                kinds.append('text')
        return kinds

    rows = rows_of(html)
    i = 0
    while i < len(rows):
        cells = cells_of(rows[i])
        kinds = classify(cells)
        if 'interact' in rows[i]:
            current_section = strip_tags(cells[0]) if cells else ''
            i += 1
            continue
        if 'class="black"' in rows[i]:
            title = strip_tags(cells[0])
            tm = re.search(r'(Morning|Day|Evening|Night|All Day)\s*-\s*(.+)', title)
            if tm:
                time_part = tm.group(1)
                cond_time = {'Morning': 'time-morning', 'Day': 'time-day', 'Evening': 'time-evening',
                             'Night': 'time-night', 'All Day': 'time-day'}.get(time_part, 'time-day')
                cond_weather = PLA_WEATHER.get(tm.group(2).strip(), 'weather-normal')
                current_cond = [cond_time, cond_weather]
            else:
                current_cond = ['pla-' + re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')]
            i += 1
            continue
        if kinds and kinds[0] == 'sprite' and all(k == 'sprite' for k in kinds):
            # collect until level row
            ids = []
            for c in cells:
                m = re.search(r'/small/(\d+)\.png', c)
                ids.append(int(m.group(1)) if m else 0)
            alpha_flags = [False] * len(ids)
            rates = [0.0] * len(ids)
            levels = [(1, 100)] * len(ids)
            got_rates = got_levels = False
            j = i + 1
            while j < len(rows):
                rc = cells_of(rows[j])
                if not rc:
                    j += 1
                    continue
                rk = classify(rc)
                if rk and rk[0] == 'sprite':
                    break  # next block starts
                if len(rc) == len(ids):
                    if any('alpha.png' in c for c in rc) and not got_rates:
                        alpha_flags = ['alpha.png' in c for c in rc]
                    elif any(re.search(r'^\s*[\d.]+%\s*$', strip_tags(c)) for c in rc) and not got_rates:
                        rates = [float(m.group(1)) for c in rc for m in [re.search(r'([\d.]+)%', c)] if m]
                        got_rates = True
                    elif any(re.search(r'^\s*\d+\s*-\s*\d+\s*$', strip_tags(c)) for c in rc) or all('Level' in c for c in rc):
                        lvls = []
                        for c in rc:
                            lm = re.search(r'(\d+)\s*-\s*(\d+)', c)
                            lvls.append((int(lm.group(1)), int(lm.group(2))) if lm else (1, 100))
                        levels = lvls
                        got_levels = True
                if got_rates and got_levels:
                    break
                j += 1
            for k, sid in enumerate(ids):
                if sid not in wanted_species:
                    continue
                cd = list(current_cond)
                if k < len(alpha_flags) and alpha_flags[k]:
                    cd.append('pla-alpha')
                if 'outbreak' in current_section.lower():
                    cd.append('pla-mass-outbreak')
                rate = rates[k] if k < len(rates) else 0
                lvl = levels[k] if k < len(levels) else (1, 100)
                out.append({'m': 'walk', 'c': rate, 'l': [lvl[0], lvl[1]], 'v': ['pla'], 'cd': cd})
            i = j if j > i else i + 1
            continue
        i += 1
    return out

def parse_sv_txt(html, wanted_species):
    """Scarlet/Violet spawntable: column-aligned blocks with Level, Biomes,
    Location (Land/Water), Time-of-day, Surrounding Spawns."""
    out = []
    TIME = {'Morning': 'time-morning', 'Day': 'time-day', 'Evening': 'time-evening', 'Night': 'time-night'}

    def emit(cols):
        for sid, col in cols.items():
            if sid not in wanted_species:
                continue
            locs = col.get('location', ['Land'])
            times = [TIME.get(t) for t in col.get('time', [])]
            times = [t for t in times if t] or ['time-day']
            biomes = col.get('biomes', [])
            cd_base = times + ['sv-biome-' + re.sub(r'[^a-z0-9]+', '-', b.lower()) for b in biomes]
            if col.get('mass'):
                cd_base.append('sv-mass')
            for loc in locs:
                out.append({'m': 'surf' if loc == 'Water' else 'walk',
                            'c': 0,  # SV tables publish no percentages
                            'l': list(col.get('level', (1, 100))),
                            'v': ['scarlet', 'violet'],
                            'cd': list(cd_base)})

    pending = {}
    for row in rows_of(html):
        cells = cells_of(row)
        if not cells:
            continue
        blob = ''.join(cells)
        if 'scarletviolet/pokemon/new/small' in blob and '<b>' not in blob:
            if pending:
                emit(pending)
                pending = {}
            ids = []
            for c in cells:
                m = re.search(r'/small/(\d+)\.png', c)
                ids.append(int(m.group(1)) if m else 0)
            pending = {sid: {} for sid in ids if sid}
        elif '<b>Level</b>' in blob and pending:
            keys = list(pending.keys())
            for i, c in enumerate(cells):
                if i < len(keys):
                    lm = re.search(r'(\d+)\s*-\s*(\d+)', c)
                    pending[keys[i]]['level'] = (int(lm.group(1)), int(lm.group(2))) if lm else (1, 100)
        elif '<b>Biomes</b>' in blob and pending:
            keys = list(pending.keys())
            for i, c in enumerate(cells):
                if i < len(keys):
                    body = strip_tags(c.replace('<b>Biomes</b>', ''))
                    pending[keys[i]]['biomes'] = [b.strip() for b in body.split(',') if b.strip()]
        elif '<b>Location</b>' in blob and pending:
            keys = list(pending.keys())
            for i, c in enumerate(cells):
                if i < len(keys):
                    body = strip_tags(c.replace('<b>Location</b>', ''))
                    pending[keys[i]]['location'] = ['Water'] if 'Water' in body else ['Land']
        elif '<b>Time</b>' in blob and pending:
            keys = list(pending.keys())
            for i, c in enumerate(cells):
                if i < len(keys):
                    pending[keys[i]]['time'] = re.findall(r'Morning|Day|Evening|Night', c)
        elif '<b>Surrounding Spawns</b>' in blob and pending:
            keys = list(pending.keys())
            for i, c in enumerate(cells):
                if i < len(keys):
                    pending[keys[i]]['mass'] = 'None' not in strip_tags(c)
    if pending:
        emit(pending)
    return out

def dedupe(rows):
    seen, out = set(), []
    for r in rows:
        key = json.dumps(r, sort_keys=True)
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out

def scrape_region(region, parser, report_name):
    """Returns {speciesId: {areaStem: rows}} for the region."""
    import os
    limit = int(os.environ.get('LIMIT_PAGES', '0'))
    per_species = {}
    n = 0
    pages = area_pages(region)
    if limit:
        pages = pages[:limit]

    # Phase 1: collect pokeFilter maps + all needed spawntable ids per page
    page_maps = []
    needed = set()
    for page in pages:
        html = fetch(f'https://www.serebii.net/pokearth/{region}/{page}.shtml', cache_dir=f'/tmp/dex144_areapages_{region}')
        if not html:
            continue
        pokefilter = parse_pokefilter(html, key_divisor=10 if region == 'paldea' else 1)
        if not pokefilter:
            continue
        page_maps.append((page, pokefilter))
        for ids in pokefilter.values():
            needed.update(ids)
    print(f'  {report_name}: {len(page_maps)} area pages, {len(needed)} spawn tables')

    # Phase 2: fetch all needed spawntable txts concurrently, with disk cache
    cache_dir = f'/tmp/dex144_spawntables_{region}'
    os.makedirs(cache_dir, exist_ok=True)

    def load_txt(tid):
        cache_file = os.path.join(cache_dir, f'{tid}.txt')
        if os.path.exists(cache_file) and os.path.getsize(cache_file) > 0:
            with open(cache_file) as f:
                return f.read()
        txt = fetch(f'https://www.serebii.net/pokearth/{region}/spawntable/{tid}.txt')
        if txt:
            with open(cache_file, 'w') as f:
                f.write(txt)
        return txt

    txts = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        for tid, txt in zip(needed, pool.map(load_txt, sorted(needed))):
            if txt:
                txts[tid] = txt
    print(f'  {report_name}: {len(txts)}/{len(needed)} spawn tables loaded')

    # Phase 3: parse each unique txt ONCE per page (wanted = union of species
    # mapped to that marker on the page), then distribute rows per species.
    for page, pokefilter in page_maps:
        by_table = defaultdict(set)
        for sid, table_ids in pokefilter.items():
            for tid in table_ids:
                by_table[tid].add(sid)
        for tid, sids in by_table.items():
            txt = txts.get(tid)
            if not txt:
                continue
            parsed = parser(txt, sids)
            for r in parsed:
                for sid in sids:
                    per_species.setdefault(sid, {})
                    bucket = per_species[sid].setdefault(page, [])
                    key = json.dumps(r, sort_keys=True)
                    if key not in {json.dumps(x, sort_keys=True) for x in bucket}:
                        bucket.append(r)
                        n += 1
    print(f'  {report_name}: {n} total rows')
    return per_species

def main():
    with open(BUNDLE) as f:
        bundle = json.load(f)

    added = 0
    plans = [
        ('paldea', parse_sv_txt, 'SV', ['scarlet', 'violet']),
        ('hisui', parse_pla_txt, 'PLA', ['pla']),
    ]
    for region, parser, label, game_ids in plans:
        print(f'Scraping {label} ({region})…')
        scraped = scrape_region(region, parser, label)
        for sid, areas in scraped.items():
            sp = bundle.setdefault(str(sid), {})
            for gid in game_ids:
                sp.setdefault(gid, {})
            for area_stem, rows in areas.items():
                for gid in game_ids:
                    bucket = sp[gid].setdefault(area_stem, [])
                    for r in rows:
                        added += 1
                        if r not in bucket:
                            bucket.append(r)

    # documented approximations: BDSP from DPPt, USUM from SM (per species)
    for src, dests in {'diamond': ['bd'], 'pearl': ['sp'], 'sun': ['ultrasun'], 'moon': ['ultramoon']}.items():
        for dst in dests:
            n = 0
            for sid, by_game in bundle.items():
                if isinstance(by_game, dict) and by_game.get(src) and not by_game.get(dst):
                    by_game[dst] = by_game[src]
                    n += 1
            print(f'copied {src} → {dst}: {n} species')

    with open(BUNDLE, 'w') as f:
        json.dump(bundle, f, separators=(',', ':'))
    print(f'added {added} rows; bundle written')

if __name__ == '__main__':
    main()