import express from 'express';
const app = express();
app.use(express.json());
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';

const BASES=['https://ws-of.sertori.it:8443'];
const PATHS=[
'/xmeweb-login/api/Auth/Login',
'/xmeweb-login/api/auth/login',
'/xmeweb-login-api/api/Auth/Login',
'/effe-api/api/auth/login',
'/effepi-api/api/Auth/Login',
'/effepi-web-api/api/Auth/Login',
'/fp-api/api/Auth/Login',
'/xmeweb-login/api/Account/Login',
'/api/Auth/Login',
'/xmeweb-login-api/Auth/Login',
'/effe-api/Auth/Login'
];

async function doLogin(u,p){
 for(let b of BASES){
  for(let path of PATHS){
   let url=b+path;
   try{
    console.log("PROVO:",url);
    let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    let txt=await r.text();
    console.log(`-> STATUS ${r.status} : ${txt.substring(0,400)}`);
    if(r.ok && (txt.includes('token')||txt.includes('Token')||txt.includes('access')) && !txt.includes('<!doctype')){
     console.log(">>> TROVATO!!! <<<",url);
     return url+" ||| "+txt.substring(0,500);
    }
   }catch(e){console.log("ERR",url,e.message)}
  }
 }
 return null;
}

app.get('/',(req,res)=>{res.send(`<h2>CERCO EFFEPI API VERA v2</h2><input id=u value=scalamia><input id=p type=password><button onclick="fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})}).then(r=>r.json()).then(j=>alert(JSON.stringify(j)))">Test</button><p>Guarda i LOG su Render</p>`)});

app.post('/api/sync',async(req,res)=>{
 let f=await doLogin(req.body.username,req.body.password);
 if(f) res.json({ok:true,found:f});
 else res.json({ok:false,msg:"Nessuno, guarda LOG"});
});
app.listen(process.env.PORT||10000,()=>console.log("CERCO EFFEPI"));
