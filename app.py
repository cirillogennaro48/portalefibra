import os, json, re
from flask import Flask, request, jsonify

app = Flask(__name__)
FILE = "lavori.json"

if not os.path.exists(FILE):
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

def get_db():
    try:
        with open(FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_db(d):
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False)

def parse_sertori_raw(text):
    lavori = []
    text = text.replace("\r", "\n")
    # pattern diretto per il tuo formato
    # Es: GALLI MARTA  VIA EUSTACHI...
    matches = re.findall(r"([A-Z][A-Z \.\']{3,30})\s+(VIA [A-Z0-9 \.]{3,50}\d+)", text)
    for cliente, indirizzo in matches:
        cliente = cliente.strip()
        if any(x in cliente for x in ["CANTIERE", "ASS_FW", "AVALINK", "MAURIZIO", "MI33", "SUAV", "FW.", "RESIDENTIAL", "SOHO", "MIC_", "CC000", "G017"]):
            continue
        if len(cliente) < 4:
            continue
        lavori.append({"cliente": cliente.title(), "indirizzo": indirizzo.title(), "comune": "Milano"})
    return lavori

@app.route("/api/lavori")
def api_lavori():
    return jsonify(get_db())

@app.route("/api/import", methods=["POST"])
def api_import():
    raw = request.get_data(as_text=True)
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            rows = data
        else:
            rows = parse_sertori_raw(raw)
    except:
        rows = parse_sertori_raw(raw)

    db = get_db()
    count = 0
    for r in rows:
        if not isinstance(r, dict):
            continue
        ind = r.get("indirizzo", "")
        cli = r.get("cliente", "")
        if not ind:
            continue
        if any(d["indirizzo"] == ind and d["cliente"] == cli for d in db):
            continue
        db.insert(0, {"id": len(db)+count+1, "cliente": cli, "indirizzo": ind, "comune": r.get("comune","Milano"), "stato": "DA FARE"})
        count += 1
    save_db(db)
    return jsonify({"ok": True, "count": count})

@app.route("/")
def home():
    return """
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white min-h-screen"><div class="max-w-3xl mx-auto p-4">
<h1 class="text-2xl font-bold">PortaleFibra - ONLINE</h1>
<div class="bg-white text-black p-4 rounded-xl mt-4">
<h2 class="font-bold">Incolla da Sertori (anche 1000 righe)</h2>
<textarea id="a" class="w-full h-40 border p-2 rounded mt-2 text-xs" placeholder="Incolla qui tutto il testo..."></textarea>
<button onclick="importa()" class="w-full bg-green-600 text-white p-3 rounded-lg font-bold mt-2">IMPORTA TUTTO</button>
<p id="msg" class="text-sm mt-2 font-bold"></p>
</div>
<div class="bg-white text-black p-4 rounded-xl mt-4">
<input id="s" placeholder="Cerca via, cliente..." class="w-full p-3 border rounded-lg" oninput="filtra()">
<div id="lista" class="mt-4"></div>
</div></div>
<script>
let lavori=[];
async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); }
function filtra(){ let q=document.getElementById('s').value.toLowerCase(); let f=lavori.filter(l=> (l.cliente+' '+l.indirizzo).toLowerCase().includes(q)); document.getElementById('lista').innerHTML=f.map(l=>'<div class="bg-slate-100 p-3 rounded mb-2"><b>'+l.cliente+'</b> - '+l.indirizzo+'<br><span class="text-xs bg-yellow-200 px-2 py-1 rounded">'+l.stato+'</span></div>').join('')||'Nessun lavoro'; }
async function importa(){ let txt=document.getElementById('a').value; if(!txt) return alert('Incolla prima'); document.getElementById('msg').innerText='Importo...'; let res=await fetch('/api/import',{method:'POST',body:txt}); let j=await res.json(); document.getElementById('msg').innerText='Importati '+j.count+' lavori!'; document.getElementById('a').value=''; document.getElementById('s').value=''; carica(); }
carica();
</script></body></html>
"""

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
