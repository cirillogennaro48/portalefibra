const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const USER = "scalamia";
const PASS = "Innovazione$1";
const BASE = "https://ws-of.sertori.it:8443";

let cache = [];
let ultimoAgg = "mai";
let cookieJar = "";

async function loginSertori(){
  console.log("Login a Sertori XMEWEB...");
  try {
    // 1. GET iniziale per JSESSIONID
    let r = await fetch(`${BASE}/xmeweb/`, { redirect: 'manual' });
    let c1 = r.headers.get('set-cookie') || "";
    console.log("Cookie iniziale:", c1.substring(0,100));

    // 2. POST login
    const body = new URLSearchParams({ j_username: USER, j_password: PASS });
    let r2 = await fetch(`${BASE}/xmeweb/j_security_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': c1 },
      body: body.toString(),
      redirect: 'manual'
    });
    let c2 = r2.headers.get('set-cookie') || "";
    let location = r2.headers.get('location') || "";
    console.log("Login status:", r2.status, "Location:", location, "Cookie2:", c2.substring(0,100));

    cookieJar = c1 + "; " + c2;
    if(!c2) cookieJar = c1; // se non da secondo cookie usa primo

    // 3. Prova a chiamare la pagina protetta per confermare login
    let r3 = await fetch(`${BASE}/xmeweb/`, { headers: { 'Cookie': cookieJar } });
    let txt3 = await r3.text();
    console.log("Dopo login XMEWeb contiene 'app-root'?", txt3.includes('app-root'), "len", txt3.length);

    // 4. PROVIAMO VARI ENDPOINT API - qui devo trovare quello giusto
    const endpoints = [
      "/xmeweb/api/of",
      "/xmeweb/api/ordine",
      "/xmeweb/api/ordini",
      "/xmeweb/rest/of",
      "/xmeweb/rest/ordine",
      "/xmeweb/api/dashboard",
      "/xmeweb/api/attivita",
      "/xmeweb/api/attivita/list",
      "/xmeweb/api/anagrafica/of",
      "/xmeweb/ordini"
    ];

    for(let ep of endpoints){
      try{
        let rx = await fetch(`${BASE}${ep}`, { headers: { 'Cookie': cookieJar, 'Accept': 'application/json' } });
        let t = await rx.text();
        console.log(`PROVA ${ep} -> status ${rx.status} inizio: ${t.substring(0,120)}`);
        if(t.trim().startsWith('{') || t.trim().startsWith('[')){
          cache = JSON.parse(t);
          ultimoAgg = new Date().toLocaleString('it-IT') + " via " + ep;
          console.log("TROVATO! Dati presi da", ep, "n:", Array.isArray(cache)?cache.length:"obj");
          return;
        }
      }catch(e){ console.log("Errore ep", ep, e.message)}
    }

    console.log("Nessun endpoint JSON trovato, devo ispezionare il JS della pagina");
    // Se non trova, lascia cache vuota ma logga
  } catch(e){ console.error("Errore login:", e.message); }
}

loginSertori();
setInterval(loginSertori, 5*60*1000);

app.get('/tecnico', async (req,res)=>{
  if(req.query.refresh) await loginSertori();
  res.send(`<h2>Portale Fibra - SERTORI Auto</h2><p>Ultimo: ${ultimoAgg} - cookie: ${cookieJar.substring(0,50)}...</p><pre>${JSON.stringify(cache, null, 2).substring(0,10000)}</pre><p><a href="/tecnico?refresh=1">Forza aggiorna</a> - <a href="/debug">Debug log endpoint</a></p>`);
});

app.get('/debug', (req,res)=> res.send(`Cookie: ${cookieJar}<br>Ultimo: ${ultimoAgg}`));
app.get('/', (req,res)=> res.redirect('/tecnico'));
app.listen(PORT, ()=> console.log("Server porta", PORT));
