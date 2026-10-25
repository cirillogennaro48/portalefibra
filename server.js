import express from 'express';
import fs from 'fs';
const app = express();
app.use(express.json({limit:'5mb'}));
const FILE='./lavori.json';
if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,'[]');
const get=()=>JSON.parse(fs.readFileSync(FILE,'utf8'));
const save=(d)=>fs.writeFileSync(FILE,JSON.stringify(d));

app.get('/api/lavori',(req,res)=>res.json(get()));
app.post('/api/lavori',(req,res)=>{ const db=get(); const n={id:Date.now(),cliente:req.body.cliente||'',indirizzo:req.body.indirizzo||'',comune:req.body.comune||'',stato:req.body.stato||'DA FARE',note:req.body.note||'',data:new Date().toLocaleDateString()}; db.unshift(n); save(db); res.json(n);});
app.post('/api/import',(req,res)=>{
  const db=get();
  let count=0;
  (req.body||[]).forEach(r=>{
    if(!r.indirizzo && !r.cliente) return;
    db.unshift({id:Date.now()+count++,cliente:r.cliente||'',indirizzo:r.indirizzo||r.via||'',comune:r.comune||'',stato:r.stato||'DA FARE',note:r.note||'',data:new Date().toLocaleDateString()});
  });
  save(db); res.json({ok:true,count});
});
app.delete('/api/lavori/:id',(req,res)=>{ let db=get().filter(x=>x.id!=req.params.id); save(db); res.json({ok:true});});
app.put('/api/lavori/:id',(req,res)=>{ let db=get(); let i=db.findIndex(x=>x.id==req.params.id); if(i>=0){ db[i]={...db[i],...req.body}; save(db);} res.json(db[i]);});

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white min-h-screen"><div class="max-w-5xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra + SERTORI</h1>
<div class="bg-white text-black p-4 rounded-xl shadow mt-4">
<h2 class="font-bold">PASSO 1: Copia da Sertori in 1 click</h2>
<p class="text-sm text-gray-600 mt-1">Sei dentro Sertori? Clicca il bottone qui sotto, copia tutto e incolla nel riquadro sotto.</p>
<textarea id=importArea placeholder="Incolla qui quello che copi da Sertori..." class="w-full h-32 p-2 border rounded mt-2 text-xs"></textarea>
<div class="flex gap-2 mt-2"><button onclick="importa()" class="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold">📥 IMPORTA NEL PORTALE</button><button onclick="estrazione()" class="flex-1 bg-gray-800 text-white p-3 rounded-lg">📋 COME COPIO DA SERTORI?</button></div>
<div id=istru class="hidden bg-yellow-50 p-3 rounded mt-3 text-sm border">1) Apri ws-of.sertori.it:8443 e fai login<br>2) Premi F12 > Console<br>3) Incolla questo e dai INVIO:<br><code class="block bg-black text-green-400 p-2 rounded text-xs mt-2 break-all">let rows=[...document.querySelectorAll('tr')].map(tr=>tr.innerText); copy(rows.join('\\n')); alert('Copiato! Ora incollalo nel portale')</code><br>Oppure seleziona tutta la tabella con il mouse, copia (Ctrl+C) e incolla sopra.</div>
</div>

<div class="bg-white text-black p-4 rounded-xl shadow mt-4">
<div class="flex gap-2"><input id=s placeholder="🔍 CERCA ONLINE: via, cliente..." class="flex-1 p-3 border rounded-lg" oninput="filtra()"><select id=fstato class="p-3 border rounded-lg" onchange="filtra()"><option value="">Tutti</option><option>DA FARE</option><option>IN CORSO</option><option>COLLAUDATO</option><option>FATTURATO</option></select></div>
<div id=lista class="mt-4 space-y-2"></div>
</div>
</div>
<script>
let lavori=[];
async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); }
function filtra(){ let q=document.getElementById('s').value.toLowerCase(); let fs=document.getElementById('fstato').value; let fil=lavori.filter(l=>{ let okS=!fs||l.stato==fs; let txt=(l.cliente+' '+l.indirizzo+' '+l.comune).toLowerCase(); return okS&&(!q||txt.includes(q)); }); document.getElementById('lista').innerHTML=fil.map(l=>\`<div class="bg-slate-100 p-3 rounded flex justify-between"><div><b>\${l.cliente}</b> - \${l.indirizzo} (\${l.comune})<br><span class="text-xs px-
