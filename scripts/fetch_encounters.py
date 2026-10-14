#!/usr/bin/env python3
"""Equivalent of scripts/fetchEncounters.mjs for environments without Node.
Generates public/data/encounters.json from PokéAPI."""
import json, time, threading, queue, urllib.request, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_TO_GAME_ID = {
    'red':'red','blue':'blue','yellow':'yellow','gold':'gold','silver':'silver','crystal':'crystal',
    'ruby':'ruby','sapphire':'sapphire','emerald':'emerald','firered':'firered','leafgreen':'leafgreen',
    'diamond':'diamond','pearl':'pearl','platinum':'platinum','heartgold':'heartgold','soulsilver':'soulsilver',
    'black':'black','white':'white','black-2':'black2','white-2':'white2','x':'x','y':'y',
    'omega-ruby':'omegaruby','alpha-sapphire':'alphasapphire','sun':'sun','moon':'moon',
    'ultra-sun':'ultrasun','ultra-moon':'ultramoon','lets-go-pikachu':'lgp','lets-go-eevee':'lge',
    'sword':'sword','shield':'shield','brilliant-diamond':'bd','shining-pearl':'sp',
    'legends-arceus':'pla','scarlet':'scarlet','violet':'violet',
}
TOTAL, THREADS = 1025, 12
seen, lock, q = {}, threading.Lock(), queue.Queue()
for i in range(1, TOTAL + 1): q.put(i)
cursor = 0

def fetch_one(pid):
    url = f'https://pokeapi.co/api/v2/pokemon/{pid}/encounters'
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Dex144-encounter-sync'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if 'HTTP Error 404' in str(e): return []
            time.sleep(0.5 * (attempt + 1) ** 2)
    print(f'FAILED #{pid}'); return []

def normalize(raw):
    result = {}
    for area_entry in raw:
        area = area_entry['location_area']['name']
        for vd in area_entry['version_details']:
            gid = VERSION_TO_GAME_ID.get(vd['version']['name'])
            if not gid: continue
            result.setdefault(gid, {}).setdefault(area, [])
            for ed in vd['encounter_details']:
                key = (ed['method']['name'], ed['chance'], ed['min_level'], ed['max_level'])
                slot = next((d for d in result[gid][area] if (d['m'], d['c'], d['l'][0], d['l'][1]) == key), None)
                if not slot:
                    slot = {'m': key[0], 'c': key[1], 'l': [key[2], key[3]], 'v': []}
                    result[gid][area].append(slot)
                if vd['version']['name'] not in slot['v']: slot['v'].append(vd['version']['name'])
    return result

def worker():
    while True:
        try: pid = q.get_nowait()
        except queue.Empty: return
        games = normalize(fetch_one(pid))
        with lock:
            if games: seen[pid] = games
            n = q.qsize()
        if n % 50 < THREADS: print(f'  ~{TOTAL - n}/{TOTAL}', flush=True)

ts = [threading.Thread(target=worker) for _ in range(THREADS)]
for t in ts: t.start()
for t in ts: t.join()

out = os.path.join(ROOT, 'public', 'data', 'encounters.json')
os.makedirs(os.path.dirname(out), exist_ok=True)
data = {str(k): v for k, v in seen.items()}
with open(out, 'w') as f: json.dump(data, f, separators=(',', ':'))
gids = sorted({g for v in data.values() for g in v})
print(f'Wrote {out}: {os.path.getsize(out)/1048576:.2f} MB, {len(data)}/{TOTAL} species, games: {gids}')
