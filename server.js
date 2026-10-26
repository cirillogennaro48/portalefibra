const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const USER = "IL_scalamia";
const PASS = "LA_Innovazione$1";
const BASE = "https://ws-of.sertori.it:8443";

let cache = [];
let ultimoAgg = "mai";

async function loginSertori(){
  console.log("Login a Sertori XMEWEB...");
  try {
    // Passo 1: prendi la pagina di login per cookie
    const r1 = await fetch(`${BASE}/xmeweb/`, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual'
    });
    const cookie = r1.headers.get('set-cookie') || "";
    
    // Passo 2: prova login con form classico j_security_check
    const body = new URLSearchParams();
    body.append('j_username', USER);
    body.append('j_password', PASS);

    const r2 = await fetch(`${BASE}/xmeweb/j_security_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0'
      },
      body: body.toString(),
      redirect: 'manual'
    });

    console.log("Login status:", r2.status, "cookie:", cookie.substring(0,80));
    
    // Passo 3: prendi i dati - PROVA endpoint giusto
    // Prova a cambiare questo se non va: /xmeweb/api/ordini o /xmeweb/rest/...
    const r3 = await fetch(`${BASE}/xmeweb/api/of/list`, {
      headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' }
    });
    
    const txt = await r3.text();
    console.log("Risposta Sertori primi 200 caratteri:", txt.substring(0,200));
    
    if(txt.trim().startsWith('{') || txt.trim().startsWith('[')){
        cache = JSON.parse(txt);
        ultimoAgg = new Date().toLocaleString('it-IT');
        console.log("Attivo - trovati", cache.length, "lavori");
    } else {
        console.log("Sertori ha risposto HTML, non JSON. Mantengo cache precedente. Lunghezza:", txt.length);
    }

  } catch(e){
    console.error("Errore:", e.message);
  }
}

loginSertori();
setInterval(loginSertori, 5*60*1000); // ogni 5 min

app.get('/tecnico', (req,res)=>{
  res.send(`
    <h2>Portale Fibra - SERTORI Auto</h2>
    <p>Ultimo aggiornamento: ${ultimoAgg} - si aggiorna ogni 5 min</p>
    <pre>${JSON.stringify(cache, null, 2)}</pre>
    <p><a href="/tecnico?refresh=1">Forza aggiorna</a></p>
  `);
});

app.get('/', (req,res)=> res.redirect('/tecnico'));

app.listen(PORT, ()=> console.log("Server su porta", PORT));
