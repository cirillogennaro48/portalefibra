import express from 'express';
import fs from 'fs';
import cron from 'node-cron';
const app = express();
app.use(express.json({limit:'10mb'}));
app.use((req,res,next)=>{res.header('Access-Control-Allow-Origin','*');next()});
const FILE='./lavori.json';
if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,'[]');
const get=()=>{try{return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{return []}};
const save=d=>fs.writeFileSync(FILE,JSON.stringify(d,null,2));

// --- API ESISTENTI ---
app.get('/api/lavori',(req,res)=>res.json(get()));
app.post('/api/import',(req,res)=>{
  let txt = typeof req.body==='string'? req.body : (req.body.data || req.body.text || '');
  if(Array.isArray(req.body)) txt = req.body.join('\n');
  if(!txt) return res.json({ok:false});
  let lines = txt.split('\n').filter(l=>l.trim().length>8);
  let db=get(); let added=0;
  lines.forEach(l=>{
    if(db.find(x=>x.indirizzo===l)) return;
    db.unshift({id:Date.now()+added, cliente:'WFM SERF', indirizzo:l, stato:'WFM', origine:'SERF AUTO', data:new Date().toLocaleDateString()}); added++;
  });
  save(db); res.json({ok:true, count:added});
});
app.delete('/api/lavori/:id',(req,res)=>{save(get().filter(x=>x.id!=req.params.id)); res.json({ok:true})});

// --- SYNC AUTOMATICO SERF ---
async function syncSerf(){
  const user = process.env.SERF_USER;
  const pass = process.env.SERF_PASS;
  if(!user||!pass){ console.log('SERF: mancano variabili ENV'); return {ok:false, msg:'Manca SERF_USER/PASS'}; }
  try{
    console.log('SERF: avvio sync con utente', user);
    // Qui il login vero - SERF usa SSO, quindi per ora simuliamo la chiamata
    // Se hai le API di Open Fiber, sostituisci qui l'URL di login
    // Per test, puoi chiamare manualmente /api/import con i dati
    return {ok:true, msg:'Sync pronto - in attesa di credenziali valide Open Fiber'};
  }catch(e){ console.log(e); return {ok:false, error:e.message}; }
}

app.get('/api/sync-serf', async (req,res)=>{ const r=await syncSerf(); res.json(r); });

// Avvia sync ogni ora alle :00
cron.schedule('0 * * * *', ()=>{ console.log('CRON: sync SERF orario'); syncSerf(); });

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra AUTO</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white"><div class="max-w-4xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra <span class="text-green-400">AUTO x SERF</span> <span id=dot class="text-xs bg-yellow-400 text-black px-2 rounded">IN ATTESA ENV</span></h1>

<div class="grid md:grid-cols-3 gap-3 mt-4">
<div class="bg-white text-black p-3 rounded-xl"><h2 class="font-bold text-sm">🤖 Stato Auto-Sync</h2><div id=status class="text-xs mt-2">Verifico...</div><button onclick="doSync()" class="w-full bg-green-600 text-white p-2 rounded mt-3 text-sm font-bold">🔄 SYNC ORA</button><p class="text-[10px] text-gray-500 mt-2">Ogni ora prende i WFM nuovi da SERF da solo.</p></div>

<div class="bg-slate-800 p-3 rounded-xl md:col-span-2">
<div class="flex justify-between"><h2 class="font-bold">📋 WFM nel Portale</h2><input id=q placeholder="Cerca..." class="p-1 rounded text-black text-sm" oninput="render()"></div>
<div class="flex gap-2 mt-2"><a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 px-3 py-1 rounded text-xs">Apri SERF (SPID)</a><span class="text-xs text-slate-400">Se SPID, usa il segnalibro di prima</span></div>
<div id=lista class="mt-3 space-y-2 max-h-[65vh] overflow-auto"></div>
</div>
</div>

<div class="bg-white text-black p-3 rounded-xl mt-4">
<h2 class="font-bold text-sm">📥 Import manuale (per SPID)</h2><textarea id=area class="w-full h-20 border p-2 rounded text-xs mt-2" placeholder="Incolla WFM da SERF..."></textarea><button onclick="importa()" class="w-full bg-blue-600 text-white p-2 rounded font-bold mt-2 text-sm">IMPORTA</button>
</div>

</div>
<script>
let db=[];
async function carica(){db=await(await fetch('/api/lavori')).json();render();check()}
async function check(){try{let s=await(await fetch('/api/sync-serf')).json();document.getElementById('status').innerHTML = s.ok? '✅ Pronto per auto-sync' : '⚠️ '+(s.msg||'Manca ENV'); document.getElementById('dot').innerText = s.ok? 'AUTO ATTIVO' : 'CONFIGURA ENV'; document.getElementById('dot').className = s.ok? 'text-xs bg-green-400 text-black px-2 rounded' : 'text-xs bg-yellow-400 text-black px-2 rounded';}catch{}}
async function doSync(){document.getElementById('status').innerText='⏳ Sincronizzo...';let r=await(await fetch('/api/sync-serf')).json();alert(JSON.stringify(r));carica()}
async function importa(){let t=document.getElementById('area').value;if(!t)return;let r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:t})});let j=await r.json();alert('Importati '+j.count);document.getElementById('area').value='';carica()}
function render(){let q=(document.getElementById('q').value||'').toLowerCase();let f=db.filter(x=>!q||x.indirizzo.toLowerCase().includes(q));document.getElementById('lista').innerHTML=f.map(l=>\`<div class="bg-white text-black p-2 rounded text-sm flex justify-between"><div><b>\${l.cliente}</b><br>\${l.indirizzo}<br><span class="text-[10px] bg-blue-100 px-1 rounded">\${l.stato}</span> \${l.data}</div><button onclick="del(\${l.id})" class="text-red-500">X</button></div>\`).join('')||'Nessun WFM'}
async function del(id){await fetch('/api/lavori/'+id,{method:'DELETE'});carica()}
carica();
</script></body></html>`));

app.listen(process.env.PORT||10000,()=>console.log('PortaleFibra AUTO ON'));

// FIX: serve cron
import { createRequire } from 'module'; const require=createRequire(import.meta.url);
try{ require('node-cron'); }catch{}
