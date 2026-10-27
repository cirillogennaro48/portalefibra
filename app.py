import os, json, re
from flask import Flask, request, jsonify
app = Flask(__name__)
FILE = "lavori.json"
if not os.path.exists(FILE):
    with open(FILE, "w", encoding="utf-8") as f: json.dump([], f)
def get_db():
    try:
        with open(FILE, "r", encoding="utf-8") as f: return json.load(f)
    except: return []
def save_db(d):
    with open(FILE, "w", encoding="utf-8") as f: json.dump(d, f, ensure_ascii=False)

def parse_sertori_raw(text):
    lavori=[]
    # spezza per ogni cantiere
    chunks = re.split(r'\n\s*\d+\s*\nCANTIERE DI MILANO', text)
    for chunk in chunks:
        if "VIA" not in chunk and "TLC_" not in chunk and "CC000" not in chunk: continue
        # cliente e indirizzo
        m = re.search(r"([A-Z][A-Z \.\']{3,30})\s+(VIA [A-Z0-9 \.]{3,50}\d+)", chunk)
        cliente = m.group(1).strip().title() if m else ""
        indirizzo = m.group(2).strip().title() if m else ""
        if any(x in cliente.upper() for x in ["CANTIERE","ASS_FW","AVALINK","MAURIZIO","SUAV","FW.","RESIDENTIAL","MIC_","CC000","G017"]): cliente=""
        if not indirizzo and not cliente: 
            # prova comunque a prendere TLC
            if "TLC_" not in chunk and "CC000" not in chunk: continue
        # codici
        codice = ""
        for pat in [r"(TLC_\d+)", r"(CC\d+)", r"(WR\d+)", r"(\d{7,8})"]:
            mm = re.search(pat, chunk)
            if mm:
                codice = mm.group(1)
                if codice.startswith("TLC_") or codice.startswith("CC"): break
        # telefono
        tel = ""
        tm = re.search(r"(\d{10})", chunk)
        if tm: tel = tm.group(1)
        # coordinate
        coord = re.search(r"(\d{2},\d+)\s+(\d+,\d+)", chunk)
        if cliente or indirizzo or codice:
            lavori.append({"cliente":cliente or "Cliente", "indirizzo":indirizzo or codice, "comune":"Milano", "codice":codice, "telefono":tel, "raw":chunk[:300]})
    # fallback semplice se incolli solo una riga tipo TLC_00000000402627 VIA...
    if not lavori:
        for line in text.splitlines():
            if "TLC_" in line or "CC000" in line:
                codice = re.search(r"(TLC_\d+|CC\d+)", line)
                via = re.search(r"(VIA [A-Z0-9 ]+)", line)
                lavori.append({"cliente":"Cliente","indirizzo":via.group(1).title() if via else line[:40], "comune":"Milano", "codice":codice.group(1) if codice else line.strip(), "telefono":""})
    return lavori

@app.route("/api/lavori")
def api_lavori(): return jsonify(get_db())

@app.route("/api/import", methods=["POST"])
def api_import():
    raw = request.get_data(as_text=True)
    try:
        data=json.loads(raw)
        rows=data if isinstance(data,list) else parse_sertori_raw(raw)
    except:
        rows=parse_sertori_raw(raw)
    db=get_db(); count=0
    for r in rows:
        if not isinstance(r,dict): continue
        cod=r.get("codice","")
        ind=r.get("indirizzo","")
        # evita duplicati su codice
        if cod and any(d.get("codice")==cod for d in db): continue
        if not cod and ind and any(d.get("indirizzo")==ind and d.get("cliente")==r.get("cliente") for d in db): continue
        if not ind and not cod: continue
        db.insert(0, {"id":len(db)+count+1, "cliente":r.get("cliente",""), "indirizzo":ind, "comune":r.get("comune","Milano"), "codice":cod, "telefono":r.get("telefono",""), "stato":"DA FARE"})
        count+=1
    save_db(db)
    return jsonify({"ok":True,"count":count})

@app.route("/")
def home():
    return """<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white min-h-screen"><div class="max-w-3xl mx-auto p-4"><h1 class="text-xl font-bold">🚀 PortaleFibra PRO</h1><div class="bg-white text-black p-4 rounded-xl mt-4"><h2 class="font-bold">Incolla da Sertori</h2><textarea id="a" class="w-full h-32 border p-2 rounded mt-2 text-xs" placeholder="Incolla qui anche solo TLC_00000000402627 ..."></textarea><button onclick="importa()" class="w-full bg-green-600 text-white p-3 rounded-lg font-bold mt-2">IMPORTA TUTTO</button><p id="msg" class="text-sm mt-2 font-bold"></p></div><div class="bg-white text-black p-4 rounded-xl mt-4"><input id="s" placeholder="🔍 Cerca per Codice TLC / CC / WR / Via / Cliente / Telefono..." class="w-full p-3 border-2 border-black rounded-lg font-bold" oninput="filtra()"><div id="lista" class="mt-4"></div></div></div><script>let lavori=[]; async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); } function filtra(){ let q=document.getElementById('s').value.toLowerCase(); let f=lavori.filter(l=> (l.cliente+' '+l.indirizzo+' '+(l.codice||'')+' '+(l.telefono||'')).toLowerCase().includes(q)); document.getElementById('lista').innerHTML=f.map(l=>`<div class="bg-slate-100 p-3 rounded mb-2 border"><div class="flex justify-between"><b>${l.cliente}</b><span class="text-xs bg-black text-white px-2 py-1 rounded">${l.codice||''}</span></div><div>${l.indirizzo} ${l.comune}</div><div class="text-xs text-gray-600">${l.telefono||''}</div><div class="flex gap-2 mt-2"><a href="tel:${l.telefono}" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Chiama</a><a href="https://www.google.com/maps/search/${encodeURIComponent(l.indirizzo+' '+l.comune)}" target="_blank" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">Mappa</a></div><span class="text-xs bg-yellow-200 px-2 py-1 rounded mt-2 inline-block">${l.stato}</span></div>`).join('')||'<div class="text-center py-4">Nessun lavoro trovato.<br>Prova a incollare di nuovo il codice TLC completo.</div>'; } async function importa(){ let txt=document.getElementById('a').value; if(!txt) return alert('Incolla prima'); document.getElementById('msg').innerText='Importo...'; let res=await fetch('/api/import',{method:'POST',body:txt}); let j=await res.json(); document.getElementById('msg').innerText='Importati '+j.count+' lavori!'; document.getElementById('a').value=''; carica(); } carica();</script></body></html>"""
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
