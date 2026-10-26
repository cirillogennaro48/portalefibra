const express = require('express');
const app = express();

const USER = "scalamia";
const PASS = "Innovazione$1";
const LOGIN_URL = "https://ws-of.sertori.it:8443/xmeweb-login/api/login";

let cacheDati = [];
let ultimoAggiornamento = "mai";

async function aggiornaDaSertori() {
  try {
    console.log("Login a Sertori XMEWEB...");
    
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USER, password: PASS })
    });
    
    const json = await res.json();
    // Sertori ti restituisce un token
    const token = json.token || json.access_token;
    
    // Ora prende le assegnazioni
    const lista = await fetch("https://ws-of.sertori.it:8443/xmeweb/api/assegnazioni", {
      headers: { "Authorization": "Bearer " + token }
    });
    
    cacheDati = await lista.json();
    ultimoAggiornamento = new Date().toLocaleString("it-IT");
    console.log("OK aggiornato: " + ultimoAggiornamento);

  } catch (e) {
    console.log("Errore:", e.message);
  }
}

setInterval(aggiornaDaSertori, 5 * 60 * 1000);
aggiornaDaSertori();

app.get('/tecnico', (req, res) => {
  res.send(`
    <h2>Portale Fibra - SERTORI Auto</h2>
    <p>Ultimo aggiornamento: ${ultimoAggiornamento} - si aggiorna ogni 5 min</p>
    <pre>${JSON.stringify(cacheDati, null, 2)}</pre>
    <script>setTimeout(()=>location.reload(), 300000)</script>
  `);
});

app.listen(10000, () => console.log("Attivo"));
