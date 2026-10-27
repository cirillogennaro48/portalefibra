import os, json, re
from flask import Flask, request, jsonify

app = Flask(__name__)
FILE = "lavori.json"
if not os.path.exists(FILE):
    with open(FILE, "w") as f: json.dump([], f)

def get_db():
    try:
        with open(FILE, "r") as f: return json.load(f)
    except: return []
def save_db(d):
    with open(FILE, "w") as f: json.dump(d, f)

def parse_sertori_raw(text):
    # Cerca pattern: NOME CLIENTE + VIA/CORSO/CSO + CITTA
    lavori=[]
    # Pulisci
    text = text.replace('\r','\n')
    # Trova tutte le righe con indirizzi
    pattern = re.compile(r'([A-Z\.\s]{3,40})\s+(VIA|VIALE|CORSO|CSO|PIAZZA|LARGO)\s+([A-Z0-9\.\s]+?)\s+(MILANO|SESTO|CINISELLO|MONZA)', re.IGNORECASE)
    for m in pattern.finditer(text):
        cliente = m.group(1).strip()
        # elimina spazzatura tipo CANTIERE, ASS_FW
        if len(cliente)<4 or any(x in cliente for x in ["CANTIERE","ASS_FW","MILANO","MI33","SUAV","FW.","RESIDENTIAL","SOHO","MIC_","CC000"]): continue
        indirizzo = f"{m.group(2)} {m.group(3)}".strip()
        localita = m.group(4).strip()
        # coordinate vicino
        coord = re.search(r'(\d{2},\d+)\s+(\d{1,2},\d+)', text[m.start():m.start()+2000])
        lat = coord.group(1) if coord else ""
        lavori.append({"cliente":cliente.title(), "indirizzo":indirizzo.title(), "comune":localita.title(), "lat":lat})
    # fallback: cerca righe tipo GALLI MARTA VIA EUSTACHI...
    if not lavori:
        for line in text.split("\n"):
            if "VIA" in line and len(line)>10:
                parts = line.split()
                # prova a estrarre
                lavori.append({"cliente":line[:20].strip(), "indirizzo":line.strip()[:60], "comune":"Milano"})
    return lavori[:1000]

@app.route("/api/lavori")
def api_lavori(): return jsonify(get_db())

@app.route("/api/import", methods=["POST"])
def api_import():
    db=get_db()
    data=request.get_data(as_text=True)
    try:
        j=json.loads(data)
        if isinstance(j, list): rows=j
        else: rows=parse_sertori_raw(data)
    except:
        rows=parse_sertori_raw(data)
    count=0
    for r in rows:
        if not isinstance(r, dict): continue
        if not r.get("indirizzo"): continue
        # evita duplicati
        if any(d["indirizzo"]==r["indirizzo"] and d["cliente"]==r["cliente"] for d in db): continue
        db.insert(0, {"id":len(db)+count+1, "cliente":r.get("cliente",""), "indirizzo":r.get("indirizzo",""), "comune":r.get("comune","Milano"), "stato":"DA FARE"})
        count+=1
    save_db(db)
    return jsonify({"ok":True, "count":count})

@app.route("/")
def home():
    return """<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white min-h-screen"><div class="max-w-3xl mx-auto p-4"><h1 class="text-2xl font-bold">🚀 PortaleFibra - ONLINE</h1><div class="bg-white text-black p-4 rounded-xl mt-4"><h2 class="font-bold">📥 Incolla da Sertori (anche 1000 righe)</h2><textarea id="a" class="w-full h-40 border p-2 rounded mt-2 text-xs" placeholder="Incolla qui tutto il testo che hai copiato da Sertori..."></textarea><button onclick="importa()" class="w-full bg-green-600 text-white p-3 rounded-lg font-bold mt-2">📥 IMPORTA TUTTO</button><p id="msg" class="text-sm mt-2"></p></div><div class="bg-white text-black p-4 rounded-xl mt-4"><input id="s" placeholder="🔍 Cerca via, cliente..." class="w-full p-3 border rounded-lg" oninput="filtra()"><div id="lista" class="mt-4"></div></div></div><script>let lavori=[]; async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); } function filtra(){ let q=document.getElementById('s').value.toLowerCase(); let f=lavori.filter(l=> (l.cliente+' '+l.indirizzo).toLowerCase().includes(q)); document.getElementById('lista').innerHTML=f.map(l=>`<div class="bg-slate-100 p-3 rounded mb-2"><b>${l.cliente}</b> - ${l.indirizzo} ${l.comune}<br><span class="text-xs bg-yellow-200 px-2 py-1 rounded">${l.stato}</span></div>`).join('')||'Nessun lavoro'; } async function importa(){ let txt=document.getElementById('a').value; if(!txt) return alert('Incolla prima'); document.getElementById('msg').innerText='Importo...'; let res=await fetch('/api/import',{method:'POST',body:txt}); let j=await res.json(); document.getElementById('msg').innerText='Importati '+j.count+' lavori!'; document.getElementById('a').value=''; carica(); } carica();</script></body></html>"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
