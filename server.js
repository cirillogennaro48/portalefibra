import express from 'express';
const app = express();
app.use(express.json());

app.get('/', (req,res) => {
  res.send('<h1>PortaleFibra e online!</h1><a href="/tecnico">Vai a Area Tecnico</a>');
});

app.get('/tecnico', (req,res) => {
  res.send('<h1>Area Tecnico - Pratiche WFM</h1><p>Collegato a Sertori XME</p><p>Stato: Sincronizzazione attiva</p>');
});

app.listen(10000, ()=>console.log('online'));
