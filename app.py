import os, json, re
from flask import Flask, request, jsonify
app = Flask(__name__)
FILE = "lavori.json"
if not os.path.exists(FILE):
    open(FILE,"w").write("[]")
def get_db(): return json.load(open(FILE,"r",encoding="utf-8"))
def save_db(d): json.dump(d, open(FILE,"w",encoding="utf-8"), ensure_ascii=False)

@app.route("/api/lavori")
def api_lavori():
    q = request.args.get("q","").lower()
    db = get_db()
    if not q: return jsonify(db[:20])
    # Se scrivi un codice nuovo, lo crea LIVE
    if "tlc_" in q or "cc0" in q or q.isdigit():
        if not any(q in d.get("codice","").lower() for d in db):
            db.insert(0, {"codice": q.upper(), "cliente": "LAVORO", "indirizzo": q.upper(), "stato": "DA FARE"})
            save_db(db)
    res = [d for d in db if q in (d.get("codice","")+d.get("cliente","")+d.get("indirizzo","")).lower()]
    return jsonify(res)

@app.route("/")
def home():
    return """
<html><head><meta name=viewport content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-black text-white p-4">
<h1 class="text-xl font-bold mb-4">PortaleFibra - Cerca</h1>
<input id="s" oninput="cerca()" placeholder="Scrivi TLC_00000000402627" class="w-full p-4 text-black text-xl rounded-xl font-bold" autofocus>
<div id="lista" class="mt-4"></div>
<script>
async function cerca(){
 let q=document.getElementById('s').value;
 let r=await fetch('/api/lavori?q='+q); let d=await r.json();
 document.getElementById('lista').innerHTML=d.map(x=>`<div class="bg-white text-black p-4 rounded-xl mb-2"><b class="text-lg">${x.codice}</b><br>${x.cliente} - ${x.indirizzo}<br><span class="bg-yellow-300 px-2">${x.stato}</span></div>`).join('') || 'Scrivi il codice...';
}
cerca();
</script></body></html>
"""
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
