const PUBLIC=process.env.PUBLIC_SITE_URL||'https://avarenne-campaign-site.vercel.app';

export default async function handler(req,res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed'});
  }
  try{
    const r=await fetch(`${PUBLIC}/api/audio-upload`,{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'authorization':`Bearer ${process.env.INTERNAL_ADMIN_SECRET}`
      },
      body:JSON.stringify(req.body)
    });
    const text=await r.text();
    res.status(r.status);
    res.setHeader('content-type','application/json');
    return res.send(text);
  }catch(error){
    console.error(error);
    return res.status(500).json({error:'Audio upload service unavailable'});
  }
}
