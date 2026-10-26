const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const USER = "scalamia";
const PASS = "Innovazione$1";
const BASE = "https://ws-of.sertori.it:8443";

let cache = [];
let ultimoAgg = "mai";
let cookieJar = "";

function getCookies(res){
  if(res.headers.getSetCookie) return res.headers.getSetCookie().join('; ');
  return res.headers.get('set-cookie') || "";
}

async function loginSertori(){
  console.log("Login a Sertori XMEWEB...");
  try {
    let r = await fetch(`${BASE}/xmeweb/`, { redirect: 'manual' });
    let c1 = getCookies(r);
    console.log("Cookie1:", c1.substring(0,150), "status", r.status);

    const body = new URLSearchParams({ j_username: USER, j_password: PASS });
    let r2 = await fetch(`${BASE}/xmeweb/j_security_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': c1 },
      body: body.toString(),
      redirect: 'manual'
    });
    let c2 = getCookies(r2);
    let loc = r2.headers.get('location');
    console.log("Login status:", r2.status, "Location:", loc, "Cookie2:", c2.substring(0,150));

    cookieJar = [c1, c2].filter(Boolean).join('; ');
    console.log("CookieJar finale:", cookieJar.substring(0,200));

    // prova endpoint dashboard reale - ispezionando XMEWeb di solito è /xmeweb/api/...
    let r3 = await fetch(`${BASE}/xmeweb/`, { headers: { 'Cookie': cookieJar } });
    let html = await r3.text();
    // cerca nel JS i path api
    let match = html.match(/\/xmeweb\/api\/[^"']+/g) || [];
    console.log("API trovate nell'HTML:", [...new Set(match)].slice(0,20));

    // prova a chiamare le API trovate
    for(let ep of [...new Set(match)].slice(0,15)){
      try{
        let rx = await fetch(`${BASE}${ep}`, { headers: { 'Cookie': cookieJar, 'Accept': 'application/json' } });
        let t = await rx.text();
        console.log(`PROVA ${ep} -> ${rx.status} -> ${t.substring(0,150)}`);
        if(t.trim().startsWith('{') || t.trim().startsWith('[')){
          cache = JSON.parse(t);
          ultimoAgg = new Date().toLocaleString('it-IT') + " " + ep;
          console.log("TROVATO DATI!", ep);
          return;
        }
      }catch(e){}
    }

  } catch(e){ console.error("Errore:", e.message, e.stack); }
}

loginSertori();
setInterval(loginSertori, 5*60*1000);

app.get('/tecnico', async (req,res)=>{
  if(req.query.refresh) await loginSertori();
  res.send(`<h2>Portale Fibra - SERTORI Auto</h2><p>Ultimo: ${ultimoAgg} cookie len: ${cookieJar.length}</p><pre>${JSON.stringify(cache,null,2).substring(0,15000)}</pre><a href="/tecnico?refresh=1">Forza aggiorna</a>`);
});
app.get('/', (req,res)=> res.redirect('/tecnico'));
app.listen(PORT, ()=> console.log("Porta", PORT));
