import os, json
from flask import Flask, request, jsonify

app = Flask(__name__)
FILE = "lavori.json"
if not os.path.exists(FILE):
    with open(FILE, "w") as f:
        json.dump([], f)

def get_db():
    try:
        with open(FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_db(data):
    with open(FILE, "w") as f:
        json.dump(data, f)

@app.route("/api/lavori")
def api_lavori():
    return jsonify(get_db())

@app.route("/api/import", methods=["POST"])
def api_import():
    db = get_db()
    rows = request.json or []
    count = 0
    for r in rows:
        if not r: continue
        cliente = r.get("cliente","") if isinstance(r, dict) else ""
        indirizzo = r.get("indirizzo","") if isinstance(r, dict) else str(r)
        if not indirizzo and not cliente: continue
        db.insert(0, {"id": len(db)+count+1, "cliente": cliente, "indirizzo": indirizzo, "comune": r.get("comune","") if isinstance(r, dict) else "", "stato": "DA FARE"})
        count+=1
    save_db(db)
    return jsonify({"ok": True, "count": count})

@app.route("/")
def home():
    return """
<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white min-h-screen"><div class="max-w-3xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra - ONLINE</h1>
<div class="bg-white text-black p-4 rounded-xl mt-4">
<h2 class="font-bold">📥 Incolla da Sertori</h2>
<textarea id="a" class="w-full h-32 border p-2 rounded mt-2 text-xs" placeholder="Incolla qui..."></textarea>
<button onclick="importa()" class="w-full bg-green-600 text-white p-3 rounded-lg font-bold mt-2">📥 IMPORTA</button>
</div>
<div class="bg-white text-black p-4 rounded-xl mt-4">
<input id="s" placeholder="🔍 Cerca via, cliente..." class="w-full p-3 border rounded-lg" oninput="filtra()">
<div id="lista" class="mt-4"></div>
</div>
</div>
<script>
let lavori=[];
async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); }
function filtra(){ let q=document.getElementById('s').value.toLowerCase(); let f=lavori.filter(l=> (l.cliente+' '+l.indirizzo).toLowerCase().includes(q)); document.getElementById('lista').innerHTML=f.map(l=>`<div class="bg-slate-100 p-3 rounded mb-2"><b>${l.cliente}</b> - ${l.indirizzo} - ${l.stato}</div>`).join('')||'Nessun lavoro'; }
async function importa(){ let txt=document.getElementById('a').value; if(!txt) return alert('Incolla qualcosa'); let righe=txt.split('\\n').filter(r=>r.trim().length>3).map(r=>{let p=r.split('\\t'); return {cliente:p[0]||'', indirizzo:p[1]||r, comune:p[2]||''}}); let res=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(righe)}); let j=await res.json(); alert('Importati '+j.count); document.getElementById('a').value=''; carica(); }
carica();
</script></body></html>
    """

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
