const PUBLIC=process.env.PUBLIC_SITE_URL||'https://avarenne-campaign-site.vercel.app';
export default async function handler(req,res){
  try{
    if(req.method==='GET'){const r=await fetch(`${PUBLIC}/api/settings`,{cache:'no-store'});const text=await r.text();res.status(r.status);res.setHeader('content-type','application/json');return res.send(text)}
    if(req.method==='POST'){const r=await fetch(`${PUBLIC}/api/settings`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.INTERNAL_ADMIN_SECRET}`},body:JSON.stringify(req.body)});const text=await r.text();res.status(r.status);res.setHeader('content-type','application/json');return res.send(text)}
    res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);return res.status(500).json({error:'Admin publish service unavailable'})}
}
