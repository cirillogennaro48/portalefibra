import express from 'express';
const app = express();
app.use(express.json());
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let token="";

const TRY = [
'/xmeweb-api/api/Auth/Login',
'/xmeweb-api/api/auth/login',
'/xmeweb-api/Auth/Login',
'/xmeweb-api/api/Account/Login',
'/xmeweb-api/api/Authentication/Login',
'/xmeweb-api/api/Auth/Authenticate',
'/api/Auth/Login',
'/api/auth/login',
'/xmeweb/api/Auth/Login',
'/xmeweb/api/auth/login',
'/api/Account/Login',
'/xmeweb-api/api/User/Login'
];

async function doLogin(u,p){
  for(let path of TRY){
    for(let base of ['https://ws-of.sertori.it:8443','https://ws-of.sertori.it']){
      let url=base+path;
      try{
        console.log("PROVO:",url);
        let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,UserName:u,Email:u})});
        let txt=await r.text();
        let isJson=txt.trim().startsWith('{')||txt.trim().startsWith('[');
        let isHtml=txt.includes('<!doctype')||txt.includes('<html');
        console.log(`-> ${url} STATUS ${r.status} JSON=${isJson} HTML=${isHtml} : ${txt.substring(0,300)}`);
        if(r.ok && isJson && !isHtml){
          console.log(">>> TROVATO API VERA! <<<",url);
          token=txt;
          return url;
        }
      }catch(e){console.log("ERR",url,e.message)}
    }
  }
  return null;
}

app.get('/',(req,res)=>{res.send(`<h2>PortaleFibra - CERCO API VERA</h2><input id=u value=scalamia><input id=p type=password placeholder=pass><button onclick="fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.value,password:p.value})}).then(r=>r.text()).then(t=>{document.body.innerHTML+= '<pre>'+t+'</pre>';})">Test</button>`)});

app.post('/api/sync', async (req,res)=>{
  let found=await doLogin(req.body.username, req.body.password);
  if(found) res.json({ok:true, url:found, msg:"TROVATO!"});
  else res.json({ok:false, msg:"Nessuno funziona, guarda LOG"});
});
app.listen(process.env.PORT||10000,()=>console.log("CERCO API"));
