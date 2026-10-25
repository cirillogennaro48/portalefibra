import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
let authToken="";
let lastLogin=0;
async function loginSertori(reqUser, reqPass){
  try{
    const user=reqUser||process.env.SERTORI_USER;
    const pass=reqPass||process.env.SERTORI_PASS;
    if(!user||!pass)return false;
    const r=await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Auth/Login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:pass})});
    const data=await r.json().catch(()=>({}));
    // Sertori può tornare token in data.token o data.result o data.access_token
    authToken=data.token||data.access_token||data.result||data.data||"";
    if(typeof authToken==='object') authToken=authToken.token||authToken.access_token||"";
    const cookie=r.headers.get('set-cookie')||"";
    if(cookie) authToken = authToken || cookie;
    lastLogin=Date.now();
    console.log("Login Sertori status",r.status," token trovato:",!!authToken, JSON.stringify(data).slice(0,200));
    return r.ok && !!authToken;
  }catch(e){console.log("Errore login",e.message);return false;}
}
function getAuthHeaders(){
  let h={'Content-Type':'application/json'};
  if(authToken){
    if(authToken.length>20 && !authToken.includes('=')) h['Authorization']='Bearer '+authToken;
    else h['Cookie']=authToken;
  }
  return h;
}
app.get('/',(req,res)=>{res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial;padding:15px;background:#f5f7fb}h2{color:#111}.card{background:#fff;border-radius:12px;padding:14px;margin:12px 0;box-shadow:0 2px 10px rgba(0,0,0,.07)}.badge{padding:4px 10px;border-radius:20px;font-size:12px;color:#fff;background:#2563eb} .top{display:flex;justify-content:space-between;align-items:center}button{padding:10px 14px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:600}input{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin:6px 0}</style></head><body><div id=loginPage><h2>PortaleFibra - Login</h2><input id=user placeholder="Username Sertori"><input id=pass type=password placeholder="Password"><button onclick="doLogin()">Collega e Sincronizza</button><p id=msg></p></div><div id=techPage style=display:none><div class=top><h2>Area Tecnico - LIVE Sertori</h2><button onclick="load()">Aggiorna</button></div><p id=info></p><div id=list></div><button onclick="showLogin()">Torna al login</button></div><script>function showLogin(){loginPage.style.display='block';techPage.style.display='none'}function showTech(){loginPage.style.display='none';techPage.style.display='block'}async function doLogin(){msg.innerText="Collegamento...";try{let r=await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user.value,password:pass.value})});let d=await r.json();if(r.ok){msg.innerText="Collegato! Status: "+r.status;showTech();load();}else{msg.innerText="Errore: "+(d.message||r.status)}}catch(e){msg.innerText="Errore: "+e.message}}async function load(){info.innerText="Caricamento pratiche...";try{let r=await fetch("/api/pratiche");let d=await r.json();console.log(d);let arr=d.result||d.data||d;if(!Array.isArray(arr))arr=[arr];if(!arr.length||d.message){info.innerText="Nessuna pratica o sessione scaduta, torna al login";list.innerHTML='<a href="#" onclick="showLogin()">Login</a>';return;}info.innerText="Trovate "+arr.length+" pratiche - LIVE da Sertori";list.innerHTML=arr.map(p=>"<div class=card><b>"+(p.codiceAttivita||p.codice||p.idAttivita||p.id||"Pratica")+"</b><br><small>"+(p.indirizzo||p.indirizzoCliente||p.cliente||p.ragioneSociale||"")+"</small><br><small>Stato: "+(p.stato||p.descrizioneStato||p.statoAttivita||"")+"</small><br><small style=color:#666>"+(p.dataCreazione||p.dataAppuntamento||"")+"</small></div>").join("")}catch(e){info.innerText="Errore: "+e.message}} // auto try load on start load(); </script></body></html>`)});
app.get('/api/pratiche',async(req,res)=>{try{if(!authToken||Date.now()-lastLogin>1000*60*15){await loginSertori();}let headers=getAuthHeaders();let r=await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Wfm/Full?skip=0&take=100',{method:'POST',headers:headers,body:JSON.stringify({filterRequest:""})});if(r.status===401||r.status===403){await loginSertori();headers=getAuthHeaders();r=await fetch('https://ws-of.sertori.it:8443/xmeweb-api/api/Wfm/Full?skip=0&take=100',{method:'POST',headers:headers,body:JSON.stringify({filterRequest:""})});}let text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}res.status(r.status).json(data);}catch(e){res.status(500).json({message:e.message})}});
app.post('/api/sync',async(req,res)=>{const ok=await loginSertori(req.body.username, req.body.password);if(ok) res.json({message:"Collegato!", token:true}); else res.status(401).json({message:"Login fallito, controlla user/pass"});});
const PORT=process.env.PORT||10000;
app.listen(PORT,()=>{console.log("Portale online su "+PORT);});
