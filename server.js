import express from 'express';
const app = express();
app.use(express.json());
app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra + SERF</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white h-screen flex flex-col">
<div class="bg-slate-800 p-3 flex justify-between items-center">
<h1 class="font-bold">🚀 PortaleFibra <span class="text-green-400">collegato a SERF</span></h1>
<div class="flex gap-2">
<a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 px-3 py-1 rounded text-sm">Apri SERF pieno</a>
<button onclick="document.getElementById('serf').src='https://serf.openfiber.it/serf/'" class="bg-slate-600 px-3 py-1 rounded text-sm">Ricarica</button>
</div>
</div>

<div class="flex flex-1 overflow-hidden">
<div class="w-[380px] bg-slate-800 p-3 overflow-auto hidden md:block">
<h2 class="font-bold mb-2">📋 I Tuoi Lavori (PortaleFibra)</h2>
<div class="bg-white rounded p-2 flex gap-1 mb-3"><input id=c placeholder="Cliente" class="border p-2 rounded w-1/2 text-black text-sm"><input id=i placeholder="Via" class="border p-2 rounded w-1/2 text-black text-sm"><button onclick="add()" class="bg-green-600 px-3 rounded">+</button></div>
<div id=lista class="space-y-2"></div>
<hr class="my-4 border-slate-600">
<h2 class="font-bold text-sm">🔍 Cerca rapido</h2>
<input id=q placeholder="Via, cliente..." class="w-full p-2 rounded text-black text-sm mt-2" oninput="render()">
<p class="text-xs text-slate-400 mt-4">A sinistra i tuoi, a destra SERF ufficiale. Lavori in parallelo.</p>
</div>

<div class="flex-1 bg-white flex flex-col">
<div class="bg-green-600 text-white p-2 text-sm font-bold flex justify-between"><span>🔧 SERF - serf.openfiber.it</span><span class="text-xs opacity-80">Login con le tue credenziali Open Fiber</span></div>
<iframe id=serf src="https://serf.openfiber.it/serf/" class="flex-1 w-full border-0" style="height:100%"></iframe>
</div>
</div>

<script>
let lavori=JSON.parse(localStorage.getItem('pf')||'[]');
function save(){localStorage.setItem('pf',JSON.stringify(lavori))}
function add(){let c=document.getElementById('c').value,i=document.getElementById('i').value;if(!i)return;lavori.unshift({id:Date.now(),cliente:c,indirizzo:i});save();render();document.getElementById('c').value='';document.getElementById('i').value=''}
function render(){let q=(document.getElementById('q').value||'').toLowerCase();let f=lavori.filter(l=>(l.cliente+l.indirizzo).toLowerCase().includes(q));document.getElementById('lista').innerHTML=f.map(l=>\`<div class="bg-white text-black p-2 rounded text-sm flex justify-between"><div><b>\${l.cliente}</b><br>\${l.indirizzo}</div><button onclick="del(\${l.id})" class="text-red-500">X</button></div>\`).join('')||'<p class=text-xs>Nessun lavoro</p>'}
function del(id){lavori=lavori.filter(x=>x.id!=id);save();render()}
render();
</script></body></html>`));
app.listen(process.env.PORT||10000);
