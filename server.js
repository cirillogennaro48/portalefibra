import express from 'express';
const app = express();
app.use(express.json());
let token = "";

const URLS_TO_TRY = [
  'https://ws-of.sertori.it:8443/xmeweb-api/api/Auth/Login',
  'https://ws-of.sertori.it/xmeweb-api/api/Auth/Login',
  'https://ws-of.sertori.it:8443/xmeweb/api/Auth/Login',
  'https://ws-of.sertori.it:8443/api/Auth/Login',
  'https://ws-of.sertori.it:8443/xmeweb-api/api/Account/Login',
  'https://ws-of.sertori.it:8443/xmeweb-api/api/Authentication/Login'
];

async function doLogin(user, pass) {
  for (let url of URLS_TO_TRY) {
    try {
      console.log("PROVO URL:", url);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, userName: user, UserName: user })
      });
      const txt = await r.text();
      console.log(`RISPOSTA DA ${url} -> STATUS ${r.status} : ${txt.substring(0,500)}`);
      if (r.ok) {
        try {
          const j = JSON.parse(txt);
          token = j.token || j.access_token || j.data || j.result || txt;
          if (typeof token === 'object') token = token.token || token.access_token || "";
        } catch { token = txt; }
        return true;
      }
    } catch (e) { console.log("ERRORE su", url, e.message); }
  }
  return false;
}

app.get('/', (req,res)=>{res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial;padding:20px}input{width:100%;padding:12px;margin:8px 0}button{padding:12px;background:#2563eb;color:white;border:0;border-radius:8px;width:100%}</style></head><body><h2>PortaleFibra Login - TEST URL</h2><input id="u" value="scalamia"><input id="p" type="password" placeholder="Password"><button onclick="login()">Collega e Sincronizza</button><p id="m"></p><script>async function login(){m.innerText='Provo tutti gli indirizzi... guarda i LOG su Render';const r=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})});const d=await r.json();m.innerText=JSON.stringify(d);}</script></body></html>`)});

app.post('/api/sync', async (req,res)=>{
  const ok = await doLogin(req.body.username, req.body.password);
  if(ok) res.json({ok:true, msg:"COLLEGATO! Trovato indirizzo giusto!"});
  else res.status(401).json({ok:false, msg:"Nessun indirizzo funziona - guarda LOG, vedrai tutti gli STATUS"});
});

app.get('/api/pratiche', async (req,res)=>{res.json({token: token ? "ok" : "vuoto"})});
app.listen(process.env.PORT||10000, ()=>console.log("TEST MULTI URL"));
