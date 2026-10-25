import express from 'express';
const app = express();
app.use(express.json());

app.get('/', (req,res)=>{
  res.send(`
  <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-slate-900 text-white p-4">
    <h1 class="text-2xl font-bold">PortaleFibra <span class="text-green-400">x SERF - ONLINE</span></h1>
    <div class="bg-white text-black p-4 rounded-xl mt-4">
      <a href="https://serf.openfiber.it/serf/" target="_blank" class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold block text-center">APRI SERF OPEN FIBER</a>
      <p class="text-sm mt-3">Collegamento: serf.openfiber.it/serf/ - Se vedi questo, il deploy è OK</p>
    </div>
    <div class="mt-4 bg-slate-800 p-3 rounded-xl">Stato: <span class="text-green-400">Deploy riuscito</span></div>
  </body></html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('Live on '+PORT));
