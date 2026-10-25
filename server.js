import express from 'express';
import fs from 'fs';
const app = express();
app.use(express.json({limit:'20mb'}));

const FILE='./lavori.json';
if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,'[]');
const get=()=>{try{return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{return []}};
const save=d=>fs.writeFileSync(FILE,JSON.stringify(d,null,2));

app.get('/api/lavori',(req,res)=>res.json(get()));
app.post('/api/import',(req,res)=>{
  let txt = req.body.data || req.body.text || '';
  if(typeof req.body==='string') txt=req.body;
  let lines=txt.split('\n').filter(l=>l.trim().length>5);
  let db=get(); let n=0;
  lines.forEach(l=>{
    if(db.find(x=>x.indirizzo===l.trim())) return;
    db.unshift({id:Date.now()+n, cliente:'WFM SERF', indirizzo:l.trim(), data:new Date().toLocaleDateString()}); n++;
  });
  save(db); res.json({ok:true,count:n});
});
app.delete('/api/lavori/:id',(req,res)=>{save(get().filter(x=>x.id!=req.params.id)); res.json({ok:true})});

app.get('/',(req,res)=>res.send(`<!DOCTYPE html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>PortaleFibra x SERF</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-white">
<div class="max-w-4xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra <span class="text-green-400">x SERF</span> <span class="text-xs bg-green-500 text-black px-2 rounded ml-2">ONLINE</span></h1>

<div class="bg-white text-black p-4 rounded-xl mt-4">
<h2 class="font-bold">🔗 Collegato a SERF Open Fiber</h2>
<p class="text-sm">Clicca qui sotto, fai login su SERF, poi torna qui.</p>
<div class="grid grid-cols-2 gap-3 mt-3">
<a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 text-white p-4 rounded-xl text-center font-bold">APRI SERF<br><span class="text-xs font-normal">serf.openfiber.it/serf/</span></a>
<div class="bg-slate-100 p-3 rounded-xl text-xs">1. Apri SERF<br>2. Seleziona i WFM<br>3. Ctrl+C<br>4. Incolla sotto</div>
</div>
<textarea id=area placeholder="Incolla qui i WFM copiati da SERF..." class="w-full h-28 border-2 border-blue-400 p-2 rounded mt-3 text-sm"></textarea>
<button onclick="importa()" class="w-full bg-blue-600 text-white p-3 rounded-xl font-bold mt-2">📥 IMPORTA DA SERF</button>
</div>

<div class="bg-slate-800 p-4 rounded-xl mt-4">
<div class="flex justify-between"><h2 class="font-bold">📋 WFM Importati</h2><input id=q placeholder="Cerca via..." class="p-1 rounded text-black text-sm" oninput="render()"></div>
<div id=lista class="mt-3 space-y-2"></div>
</div>
</div>
<script>
let db=[];
async function carica(){db=await(await fetch('/api/lavori')).json();render()}
async function importa(){let t=document.getElementById('area').value;if(!t)return alert('Incolla prima');let r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:t})});let j=await r.json();alert('Importati '+j.count);document.getElementById('area').value='';carica()}
function render(){let q=(document.getElementById('q').value||'').toLowerCase();let f=db.filter(x=>!q||x.indirizzo.toLowerCase().includes(q));document.getElementById('lista').innerHTML=f.map(l=>\`<div class="bg-white text-black p-2 rounded flex justify-between text-sm"><div>\${l.indirizzo}<br><span class="text-[10px]">\${l.data}</span></div><button onclick="del(\${l.id})" class="text-red-500 font-bold px-2">X</button></div>\`).join('')||'<p class=text-slate-400 text-sm>Nessun WFM</p>'}
async function del(id){await fetch('/api/lavori/'+id,{method:'DELETE'});carica()}
carica();
</script>
</body></html>`));

const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log('ON '+PORT));
`));

**Poi Commit.**

Su Render adesso vedrai:
`Deploying...` -> dopo 1 minuto `Live` verde.

Appena torna **Live**, vai su `https://portalefibra.onrender.com` e mi mandi uno screen.

Dopo che torna Live, ti attivo la versione AUTO con le variabili `SERF_USER` e `SERF_PASS` che hai (senza che mi dici la password qui).
