import express from 'express';
const app = express();
app.use(express.json());

app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html>
<html><head><meta charset=utf-8><meta name=viewport content="width=device-width"><title>PortaleFibra - Diretto</title>
<style>body{font-family:Arial;padding:15px;background:#f0f2f5}input{width:95%;padding:12px;margin:5px 0;font-size:16px}button{width:100%;padding:14px;background:#0066cc;color:white;border:0;border-radius:8px;font-size:18px;margin-top:10px}#log{background:black;color:#0f0;padding:10px;height:300px;overflow:auto;white-space:pre-wrap;margin-top:15px;font-size:12px}</style>
</head><body>
<h2>PortaleFibra - Collegamento DIRETTO</h2>
<p>Questo si collega dal TUO telefono, non da Render, quindi Sertori non lo blocca.</p>
<input id=u value=scalamia placeholder=utente>
<input id=p type=password placeholder=password>
<button onclick="test()">PROVA COLLEGAMENTO DIRETTO</button>
<div id=log>Log qui...</div>
<script>
const PATHS=[
'/xmeweb-api/api/Auth/Login',
'/xmeweb-api/api/auth/login',
'/xmeweb-api/Auth/Login',
'/xmeweb-login/api/Auth/Login',
'/xmeweb-login/api/auth/login',
'/xmeweb/api/Auth/Login',
'/api/Auth/Login',
'/xmeweb-api/api/Account/Login',
'/xmeweb-api/api/User/Login',
'/effe-api/api/Auth/Login'
];
async function test(){
 let u=document.getElementById('u').value;
 let p=document.getElementById('p').value;
 let log=document.getElementById('log');
 log.textContent='Inizio test da tuo telefono...\\n';
 let base='https://ws-of.sertori.it:8443';
 for(let path of PATHS){
  let url=base+path;
  log.textContent+='\\nPROVO: '+url+'\\n';
  try{
   let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,UserName:u,Email:u})});
   let txt=await r.text();
   log.textContent+='-> STATUS '+r.status+' RISPOSTA: '+txt.substring(0,500)+'\\n';
   if(r.ok && txt.includes('token')||txt.toLowerCase().includes('bearer')||txt.includes('Token')){
     log.textContent+='\\n>>> TROVATO!!! Questo è quello buono: '+url+' <<<\\n';
     log.textContent+='TOKEN: '+txt.substring(0,1000)+'\\n';
     alert('TROVATO API VERA! Copia questo log e mandamelo!');
     return;
   }
  }catch(e){
   log.textContent+='ERR: '+e.message+'\\n';
  }
 }
 log.textContent+='\\nFinito. Nessuno ha dato token. Mandami screenshot di questo log!';
}
</script>
</body></html>
`);
});

app.listen(process.env.PORT||10000, ()=>console.log("DIRETTO MODE"));
