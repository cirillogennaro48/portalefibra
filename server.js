import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let sessionCookie = "";
app.get('/', (req,res) => {
  res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial;padding:20px;max-width:400px;margin:auto} input{width:100%;padding:12px;margin:8px 0} button{width:100%;padding:12px;background:#2563eb;color:white;border:0;border-radius:6px}</style></head><body><h2>PortaleFibra</h2><p>Collega account Sertori XME</p><input id="u" placeholder="Username Sertori"><input id="p" type="password" placeholder="Password"><button onclick="login()">Collega e Sincronizza</button><p id="msg"></p><script>async function login(){document.getElementById('msg').innerText='Collegamento...';const r=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:document.getElementById('u').value, pass:document.getElementById('p').value})});const d=await r.json();document.getElementById('msg').innerText=d.message;if(r.ok) location.href='/tecnico';}</script></body></html>`);
});
app.get('/tecnico', (req,res) => {
  res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial;padding:10px} .card{border:1px solid #ccc;padding:12px;margin:10px 0;border-radius:8px}</style></head><body><h2>Area Tecnico - LIVE Sertori</h2><div id="list">Caricamento LIVE...</div><script>fetch('/api/pratiche').then(r=>r.json()).then(d=>{if(!d.length) document.getElementById('list').innerHTML='Nessuna pratica o sessione scaduta, torna al login <a href="/">Login</a>';else document.getElementById('list').innerHTML=d.map(p=>'<div class=card><b>'+(p.codice||p.id||'OF')+'</b> - '+(p.indirizzo||p.address||'')+'<br>Stato: '+(p.stato||p.status||'')+'</div>').join('');}).catch(e=>{document.getElementById('list').innerHTML='Errore, rifai login';});</script></body></html>`);
});
app.post('/api/sync', async (req,res)=>{
  const {user, pass} = req.body;
  try {
    const loginRes = await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Auth/Login',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({username:user, password:pass, Username:user, Password:pass})});
    const cookies = loginRes.headers.get('set-cookie') || "";
    const text = await loginRes.text();
    if(cookies) sessionCookie = cookies; else sessionCookie = "user="+user;
    res.json({message: 'Collegato! Status: '+loginRes.status});
  } catch(err){res.status(500).json({message:'Errore: '+err.message});}
});
app.get('/api/pratiche', async (req,res)=>{
  try {
    const r = await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Wfm/Full?skip=0&take=100',{method:'POST',headers:{'Content-Type':'application/json','Cookie': sessionCookie},body: JSON.stringify({filterRequest:""})});
    const data = await r.json(); const list = data.result || data.data || data || []; res.json(Array.isArray(list) ? list : []);
  } catch(e){res.json([]);}
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('online '+PORT));
