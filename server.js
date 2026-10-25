import express from 'express';
import fs from 'fs';
const app = express();
app.use(express.json({limit:'5mb'}));

const FILE = './lavori.json';
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
function getDb(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')) }catch{ return [] } }
function saveDb(d){ fs.writeFileSync(FILE, JSON.stringify(d)) }

app.get('/api/lavori', (req,res)=>{ res.json(getDb()) });
app.post('/api/import', (req,res)=>{
  const txt = req.body.data || '';
  const lines = txt.split('\n').filter(x=>x.trim().length>5);
  let db = getDb();
  let c = 0;
  for(let i=0;i<lines.length;i++){
    let l = lines[i].trim();
    if(db.find(z=>z.txt===l)) continue;
    db.unshift({id:Date.now()+c, txt:l, data:new Date().toLocaleDateString()});
    c++;
  }
  saveDb(db);
  res.json({ok:true,count:c});
});
app.delete('/api/lavori/:id', (req,res)=>{
  let db = getDb().filter(x=>x.id!=req.params.id);
  saveDb(db);
  res.json({ok:true});
});

app.get('/', (req,res)=>{
  let html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<script src="https://cdn.tailwindcss.com"></script></head>'
    + '<body class="bg-slate-900 text-white"><div class="max-w-3xl mx-auto p-4">'
    + '<h1 class="text-xl font-bold">PortaleFibra <span class="text-green-400">x SERF</span> <span class="text-xs bg-green-500 text-black px-2 rounded">VERDE</span></h1>'
    + '<div class="bg-white text-black p-4 rounded-xl mt-4">'
    + '<h2 class="font-bold">1. Collegamento a SERF</h2>'
    + '<a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 text-white p-3 rounded-xl block text-center font-bold mt-2">APRI https://serf.openfiber.it/serf/</a>'
    + '<textarea id="area" placeholder="Incolla qui i WFM copiati da SERF..." class="w-full h-24 border-2 border-blue-500 p-2 rounded mt-3 text-sm text-black"></textarea>'
    + '<button onclick="importa()" class="w-full bg-blue-600 text-white p-3 rounded-xl font-bold mt-2">IMPORTA WFM NEL PORTALE</button>'
    + '</div>'
    + '<div class="bg-slate-800 p-4 rounded-xl mt-4">'
    + '<div class="flex justify-between"><h2 class="font-bold">WFM Importati</h2><input id="q" placeholder="Cerca..." class="p-1 rounded text-black text-sm" oninput="render()"></div>'
    + '<div id="lista" class="mt-3 space-y-2"></div>'
    + '</div></div>'
    + '<script>'
    + 'let db=[];'
    + 'async function carica(){let r=await fetch("/api/lavori"); db=await r.json(); render();}'
    + 'async function importa(){let t=document.getElementById("area").value; if(!t)return alert("Incolla prima"); let r=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:t})}); let j=await r.json(); alert("Importati "+j.count+" WFM da SERF"); document.getElementById("area").value=""; carica();}'
    + 'function render(){let q=document.getElementById("q").value.toLowerCase(); let f=db.filter(x=>!q||x.txt.toLowerCase().includes(q)); let h=""; for(let i=0;i<f.length;i++){let l=f[i]; h+="<div class=\'bg-white text-black p-2 rounded flex justify-between text-sm\'><div>"+l.txt+"<br><span class=\'text-[10px]\'>"+l.data+"</span></div><button onclick=\"del("+l.id+")\" class=\'text-red-500 font-bold\'>X</button></div>"; } if(!h)h="<p class=\'text-slate-400 text-sm\'>Nessun WFM</p>"; document.getElementById("lista").innerHTML=h;}'
    + 'async function del(id){await fetch("/api/lavori/"+id,{method:"DELETE"}); carica();}'
    + 'carica();'
    + '<\/script></body></html>';
  res.send(html);
});

app.listen(process.env.PORT||10000, ()=>console.log('Live VERDE x SERF'));
