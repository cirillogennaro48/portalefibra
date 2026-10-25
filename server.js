import express from 'express';
const app = express();
app.use(express.json());

app.get('/api/ping',(req,res)=>res.json({ok:true}));

app.get('/', (req,res)=>{
  res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white p-4"><div class="max-w-2xl mx-auto"><h1 class="text-2xl font-bold">PortaleFibra x SERF <span style="color:#4ade80">ONLINE</span></h1><div style="background:white;color:black;padding:16px;border-radius:12px;margin-top:16px"><h2 style="font-weight:bold">Collegato a SERF</h2><a href="https://serf.openfiber.it/serf/" target="_blank" style="background:#16a34a;color:white;padding:12px;display:block;text-align:center;border-radius:12px;margin-top:12px;font-weight:bold;text-decoration:none">APRI SERF OPEN FIBER</a><p style="font-size:12px;margin-top:8px">https://serf.openfiber.it/serf/</p></div><div style="background:#1e293b;padding:12px;border-radius:12px;margin-top:16px">Stato: <span style="color:#4ade80">Deployed OK - Ora aggiungiamo i WFM</span></div></div></body></html>');
});

app.listen(process.env.PORT||10000, ()=>console.log('Live'));
