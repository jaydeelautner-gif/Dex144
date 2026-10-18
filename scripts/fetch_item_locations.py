"""Scrapes per-game item acquisition ("Locations") into a static dataset.

Source: Serebii item pages, whose Locations table is server-rendered and lists
where each item is found per game. One request per item, cached on disk so
reruns only fetch what is missing. Nothing is fetched at app runtime.

Run: python3 scripts/fetch_item_locations.py [--limit N] [--only slug,slug]
"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/data/itemLocations.generated.ts')
CACHE = os.path.join(ROOT, '.item-cache')
UA = {'User-Agent': 'Dex144-item-sync'}

def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode('latin-1')
        except Exception:
            if attempt == retries - 1:
                return ''
            time.sleep(0.6 * (attempt + 1) ** 2)

def strip_tags(s):
    s = re.sub(r'<br\s*/?>', ', ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = s.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&#233;', 'é').replace('&eacute;', 'é')
    s = s.replace('&alpha;', 'α').replace('&#937;', 'Ω').replace('&times;', '×')
    return re.sub(r'\s+', ' ', s).strip(' ,')

def item_slugs():
    """Every item slug from the generated table (the app's identifiers)."""
    text = open(os.path.join(ROOT, 'src/data/items.generated.ts'), encoding='utf-8').read()
    body = re.search(r'ITEMS:Record<number,ItemEntry> = (\{.*?\});', text, re.S).group(1)
    return sorted(set(re.findall(r'"slug":"([a-z0-9-]+)"', body)))

def parse_locations(html):
    """game label -> location text, from the item page's Locations section.

    Rows are structured, not a flat table: a `<td colspan=...>` names an area
    (e.g. "The Crown Tundra", "Routes and Caves"), and the following rows carry
    `<td>Game</td><td>where</td>`. Reading only the first table, or flattening
    every cell, loses rows and merges headings into the results.
    """
    out = {}
    # The Locations heading is followed by its table; take that whole table.
    m = re.search(r'>\s*Locations\s*<', html)
    if not m:
        m = re.search(r'id="locations"', html)
    if not m:
        # Some pages (e.g. Dynite Ore) only document raid/dynamax sources.
        m = re.search(r'>\s*Max Raid Battle Locations\s*<', html)
    if not m:
        return {}
    seg = html[m.end():]
    end = seg.find('</table>')
    if end < 0:
        end = min(len(seg), 40000)
    seg = seg[:end]
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', seg, re.S):
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)
        clean = [strip_tags(c) for c in cells]
        spanned = re.search(r'<td[^>]*colspan', row, re.I)
        if spanned and len(clean) == 1:
            # A single spanning cell is a section heading, not data.
            continue
        clean = [c for c in clean if c]
        if len(clean) < 2:
            continue
        where = clean[-1]
        games = clean[:-1]
        if not where or re.match(r'^(yes|no)$', where, re.I):
            continue
        for game in games:
            if len(game) > 40 or game.lower() in ('locations', 'game', 'games', 'event description'):
                continue
            out[game] = (out[game] + ' , ' + where) if game in out else where
    cleaned = {}
    for game, where in out.items():
        text = re.sub(r'\s*,\s*(,\s*)+', ' , ', where).strip(' ,')
        if text:
            cleaned[game] = text
    return cleaned

def candidate_names(slug):
    """Serebii page names to try, most specific first.

    PokeAPI identifiers sometimes carry a form suffix (e.g. "normalium-z--held"
    for Normalium Z) that the page name omits.
    """
    base = slug.replace('-', '')
    names = [base]
    if '--' in slug:
        names.append(slug.split('--')[0].replace('-', ''))
    if slug.endswith('-held'):
        names.append(slug[:-len('-held')].replace('-', ''))
    if slug.endswith('-bag'):
        names.append(slug[:-len('-bag')].replace('-', ''))
    seen, out = set(), []
    for n in names:
        if n and n not in seen:
            seen.add(n)
            out.append(n)
    return out

def scrape(slug):
    cache_file = os.path.join(CACHE, slug + '.html')
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 1000:
        html = open(cache_file, encoding='latin-1').read()
    else:
        html = ''
        for name in candidate_names(slug):
            html = fetch(f'https://www.serebii.net/itemdex/{name}.shtml')
            if html and 'Locations' in html:
                break
            html = ''
        if html:
            os.makedirs(CACHE, exist_ok=True)
            with open(cache_file, 'w', encoding='latin-1') as f:
                f.write(html)
    if not html:
        return slug, None
    return slug, parse_locations(html)

def main():
    limit = None
    only = None
    for i, a in enumerate(sys.argv):
        if a == '--limit':
            limit = int(sys.argv[i + 1])
        if a == '--only':
            only = set(sys.argv[i + 1].split(','))
    slugs = item_slugs()
    if only:
        slugs = [s for s in slugs if s in only]
    if limit:
        slugs = slugs[:limit]
    os.makedirs(CACHE, exist_ok=True)
    results, found = {}, 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        for slug, locations in pool.map(scrape, slugs):
            if locations:
                results[slug] = locations
                found += 1
    if not results:
        raise SystemExit('No locations scraped; keeping the previous file.')
    text = (
        '// Generated by scripts/fetch_item_locations.py (Serebii item pages).\n'
        '// item slug -> { game label: where to get it }.\n'
        'export const ITEM_LOCATIONS: Record<string, Record<string, string>> = '
        + json.dumps(results, ensure_ascii=False, sort_keys=True)
        + ';\n'
    )
    tmp = OUT + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(text)
    os.replace(tmp, OUT)
    total = sum(len(v) for v in results.values())
    print(f'Item locations: {found}/{len(slugs)} items, {total} game entries.')

if __name__ == '__main__':
    main()
