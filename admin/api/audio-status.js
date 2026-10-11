const PUBLIC=process.env.PUBLIC_SITE_URL||'https://avarenne-campaign-site.vercel.app';

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  try{
    const r=await fetch(`${PUBLIC}/api/audio-status`,{cache:'no-store'});
    const text=await r.text();
    res.status(r.status);
    res.setHeader('content-type','application/json');
    return res.send(text);
  }catch(error){
    console.error(error);
    return res.status(500).json({error:'Audio status unavailable'});
  }
}
