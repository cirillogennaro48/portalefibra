import express from 'express';
import fs from 'fs';
const app = express();
app.use(express.json());
const FILE='./lavori.json';
if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,'[]');
const get=()=>JSON.parse(fs.readFileSync(FILE,'utf8'));
const save=(d)=>fs.writeFileSync(FILE,JSON.stringify(d));

app.get('/api/lavori',(req,res)=>res.json(get()));
app.post('/api/lavori',(req,res)=>{
  const db=get();
  const nuovo={id:Date.now(),cliente:req.body.cliente||'',indirizzo:req.body.indirizzo||'',comune:req.body.comune||'',stato:req.body.stato||'DA FARE',note:req.body.note||'',data:new Date().toLocaleDateString()};
  db.unshift(nuovo); save(db); res.json(nuovo);
});
app.delete('/api/lavori/:id',(req,res)=>{
  let db=get(); db=db.filter(x=>x.id!=req.params.id); save(db); res.json({ok:true});
});
app.put('/api/lavori/:id',(req,res)=>{
  let db=get(); let i=db.findIndex(x=>x.id==req.params.id); if(i>=0){ db[i]={...db[i],...req.body}; save(db);} res.json(db[i]);
});

app.get('/',(req,res)=>res.send(`<!DOCTYPE html>
<html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>PortaleFibra</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-100 min-h-screen">
<div class="max-w-4xl mx-auto p-4">
<h1 class="text-2xl font-bold">🚀 PortaleFibra ONLINE</h1>
<p class="text-sm text-gray-600">Ricerca online dei tuoi lavori - funziona ovunque</p>

<div class="bg-white p-4 rounded-xl shadow mt-4">
<div class="flex gap-2">
<input id=s placeholder="🔍 CERCA ONLINE: via, cliente, comune..." class="flex-1 p-3 border rounded-lg" oninput="filtra()">
<select id=fstato class="p-3 border rounded-lg" onchange="filtra()"><option value="">Tutti stati</option><option>DA FARE</option><option>IN CORSO</option><option>COLLAUDATO</option><option>FATTURATO</option></select>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
<input id=cliente placeholder="Cliente" class="p-2 border rounded">
<input id=indirizzo placeholder="Via / Indirizzo" class="p-2 border rounded">
<input id=comune placeholder="Comune" class="p-2 border rounded">
<select id=stato class="p-2 border rounded"><option>DA FARE</option><option>IN CORSO</option><option>COLLAUDATO</option><option>FATTURATO</option></select>
</div>
<textarea id=note placeholder="Note" class="w-full p-2 border rounded mt-2"></textarea>
<button onclick="aggiungi()" class="w-full bg-blue-600 text-white p-3 rounded-lg mt-2 font-bold">+ AGGIUNGI LAVORO ONLINE</button>
</div>

<div class="grid grid-cols-4 gap-2 mt-4 text-center">
<div class="bg-white p-3 rounded shadow"><div id=cTot class="font-bold text-xl">0</div><div class="text-xs">Totali</div></div>
<div class="bg-yellow-100 p-3 rounded shadow"><div id=cFare class="font-bold text-xl">0</div><div class="text-xs">Da Fare</div></div>
<div class="bg-blue-100 p-3 rounded shadow"><div id=cCorso class="font-bold text-xl">0</div><div class="text-xs">In Corso</div></div>
<div class="bg-green-100 p-3 rounded shadow"><div id=cFatt class="font-bold text-xl">0</div><div class="text-xs">Fatturati</div></div>
</div>

<div id=lista class="mt-4 space-y-2"></div>
</div>
<script>
let lavori=[];
async function carica(){ lavori=await (await fetch('/api/lavori')).json(); filtra(); }
function filtra(){
 let q=document.getElementById('s').value.toLowerCase();
 let fs=document.getElementById('fstato').value;
 let fil=lavori.filter(l=>{
  let okS=!fs||l.stato==fs;
  let txt=(l.cliente+' '+l.indirizzo+' '+l.comune+' '+l.note).toLowerCase();
  let okQ=!q||txt.includes(q);
  return okS&&okQ;
 });
 document.getElementById('cTot').textContent=lavori.length;
 document.getElementById('cFare').textContent=lavori.filter(x=>x.stato=='DA FARE').length;
 document.getElementById('cCorso').textContent=lavori.filter(x=>x.stato=='IN CORSO').length;
 document.getElementById('cFatt').textContent=lavori.filter(x=>x.stato=='FATTURATO').length;
 document.getElementById('lista').innerHTML=fil.map(l=>\`
  <div class="bg-white p-3 rounded shadow flex justify-between">
   <div><b>\${l.cliente||'Senza nome'}</b> - \${l.indirizzo} (\${l.comune})<br>
   <span class="text-xs px-2 py-1 rounded \${l.stato=='FATTURATO'?'bg-green-200':l.stato=='IN CORSO'?'bg-blue-200':'bg-yellow-200'}">\${l.stato}</span> <span class="text-xs text-gray-500">\${l.data}</span><br><span class="text-sm">\${l.note||''}</span></div>
   <div class="flex flex-col gap-1"><select onchange="cambiaStato(\${l.id},this.value)" class="text-xs border rounded p-1"><option \${l.stato=='DA FARE'?'selected':''}>DA FARE</option><option \${l.stato=='IN CORSO'?'selected':''}>IN CORSO</option><option \${l.stato=='COLLAUDATO'?'selected':''}>COLLAUDATO</option><option \${l.stato=='FATTURATO'?'selected':''}>FATTURATO</option></select><button onclick="elimina(\${l.id})" class="text-xs text-red-500">Elimina</button></div>
  </div>\`).join('')||'<p class="text-center text-gray-500 mt-10">Nessun lavoro trovato. Aggiungine uno!</p>';
}
async function aggiungi(){
 let body={cliente:cliente.value,indirizzo:indirizzo.value,comune:comune.value,stato:stato.value,note:note.value};
 if(!body.indirizzo&&!body.cliente){alert('Metti almeno cliente o via');return;}
 await fetch('/api/lavori',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 cliente.value=indirizzo.value=comune.value=note.value=''; carica();
}
async function elimina(id){ if(!confirm('Eliminare?'))return; await fetch('/api/lavori/'+id,{method:'DELETE'}); carica(); }
async function cambiaStato(id,stato){ await fetch('/api/lavori/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({stato})}); carica(); }
carica();
</script>
</body></html>`));

app.listen(process.env.PORT||10000,()=>console.log("PortaleFibra ONLINE"));
