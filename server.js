import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

let token = "";

async function doLogin(user, pass) {
  try {
    const r = await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Auth/Login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const txt = await r.text();
    console.log("SERTORI RISPOSTA:", r.status, txt.substring(0, 500));
    if (!r.ok) return false;
    try {
      const j = JSON.parse(txt);
      token = j.token || j.access_token || j.data || j.result || txt;
      if (typeof token === 'object') token = token.token || token.access_token || "";
    } catch {
      token = txt;
    }
    return !!token;
  } catch (e) {
    console.log("ERRORE:", e.message);
    return false;
  }
}

app.get('/', (req, res) => {
  res.send(`
  <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial;padding:20px}input{width:100%;padding:12px;margin:8px 0}button{padding:12px;background:#2563eb;color:white;border:0;border-radius:8px;width:100%}.card{border:1px solid #ddd;padding:12px;margin:10px 0;border-radius:8px}</style></head><body>
  <h2>PortaleFibra Login</h2>
  <input id="u" placeholder="Username" value="scalamia">
  <input id="p" type="password" placeholder="Password">
  <button onclick="login()">Collega e Sincronizza</button>
  <p id="m"></p>
  <div id="list"></div>
  <script>
  async function login(){
    m.innerText='Collegamento...';
    const r=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})});
    const d=await r.json();
    m.innerText=JSON.stringify(d);
    if(r.ok) load();
  }
  async function load(){
    const r=await fetch('/api/pratiche');
    const d=await r.json();
    document.getElementById('list').innerHTML='<pre>'+JSON.stringify(d,null,2).substring(0,5000)+'</pre>';
  }
  </script></body></html>
  `);
});

app.post('/api/sync', async (req, res) => {
  const ok = await doLogin(req.body.username, req.body.password);
  if (ok) res.json({ ok: true, msg: "Collegato! Token ok" });
  else res.status(401).json({ ok: false, msg: "Login fallito, controlla user/pass - guarda i LOG su Render" });
});

app.get('/api/pratiche', async (req, res) => {
  res.json({ token: token ? "presente" : "vuoto", note: "test" });
});

app.listen(process.env.PORT || 10000, () => console.log("Online"));
