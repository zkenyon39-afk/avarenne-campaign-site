import { list } from '@vercel/blob';

const prefixes={
  crow:'campaign/audio/crow/',
  festival:'campaign/audio/festival/'
};

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).end();
  }
  const key=Array.isArray(req.query.track)?req.query.track[0]:req.query.track;
  const prefix=prefixes[key];
  if(!prefix)return res.status(404).json({error:'Unknown track'});
  try{
    const result=await list({prefix,limit:100,token:process.env.BLOB_READ_WRITE_TOKEN});
    const blobs=[...(result.blobs||[])].sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
    if(!blobs.length)return res.status(404).json({error:'Track not uploaded yet'});
    res.setHeader('Cache-Control','public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Location',blobs[0].url);
    return res.status(302).end();
  }catch(error){
    console.error('Audio lookup failed',key,error);
    return res.status(500).json({error:'Audio unavailable'});
  }
}
