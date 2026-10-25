import express from 'express';
const app = express();
app.use(express.json());
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra + SERF</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white">
<div class="max-w-3xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra <span class="text-green-400">x SERF</span></h1>
<div class="bg-white text-black p-4 rounded-xl mt-4">
<h2 class="font-bold">🔗 Collegamento a SERF</h2>
<p class="text-sm mt-2">SERF non si può mettere dentro per sicurezza (quella faccina che vedi). Facciamo così:</p>
<div class="grid grid-cols-2 gap-3 mt-3">
<a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 text-white p-4 rounded-xl text-center font-bold">1. APRI SERF<br><span class="text-xs font-normal">serf.openfiber.it</span></a>
<button onclick="alert('Fai così: In SERF seleziona la tabella WFM, premi Ctrl+C, torna qui e incolla sotto e clicca IMPORTA')" class="bg-slate-800 text-white p-4 rounded-xl font-bold">2. COME COPIARE<br><span class="text-xs font-normal">Guarda istruzioni</span></button>
</div>
<textarea id=area placeholder="Incolla qui i WFM copiati da SERF..." class="w-full h-32 border p-2 rounded mt-3 text-sm"></textarea>
<button onclick="importa()" class="w-full bg-blue-600 text-white p-3 rounded-xl font-bold mt-2">📥 IMPORTA WFM NEL PORTALE</button>
</div>

<div class="bg-slate-800 p-4 rounded-xl mt-4">
<div class="flex justify-between items-center"><h2 class="font-bold">📋 WFM Importati da SERF</h2><input id=q placeholder="Cerca via..." class="p-2 rounded text-black text-sm" oninput="render()"></div>
<div id=lista class="mt-3 space-y-2"></div>
</div>
</div>
<script>
let db=JSON.parse(localStorage.getItem('serf')||'[]');
function save(){localStorage.setItem('serf',JSON.stringify(db))}
function importa(){let t=document.getElementById('area').value;if(!t)return alert('Incolla prima');let rows=t.split('\\n').filter(r=>r.trim().length>5);rows.forEach((r,i)=>{db.unshift({id:Date.now()+i,cliente:'WFM',indirizzo:r,stato:'DA FARE'})});save();render();document.getElementById('area').value='';alert('Importati '+rows.length+' WFM!')}
function render(){let q=(document.getElementById('q').value||'').toLowerCase();let f=db.filter(x=>x.indirizzo.toLowerCase().includes(q));document.getElementById('lista').innerHTML=f.map(l=>\`<div class="bg-white text-black p-3 rounded flex justify-between text-sm"><div>\${l.indirizzo}</div><button onclick="del(\${l.id})" class="text-red-500 font-bold">X</button></div>\`).join('')||'<p class=text-slate-400 text-sm>Nessun WFM, importa da SERF</p>'}
function del(id){db=db.filter(x=>x.id!=id);save();render()}
render();
</script></body></html>`));
app.listen(process.env.PORT||10000);
