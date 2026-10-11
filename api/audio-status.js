import { list } from '@vercel/blob';

async function latest(prefix){
  const result=await list({prefix,limit:100,token:process.env.BLOB_READ_WRITE_TOKEN});
  const blobs=[...(result.blobs||[])].sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
  return blobs[0]||null;
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  try{
    const [crow,festival]=await Promise.all([
      latest('campaign/audio/crow/'),
      latest('campaign/audio/festival/')
    ]);
    res.setHeader('Cache-Control','no-store, max-age=0');
    return res.status(200).json({
      crow:crow?{ready:true,uploadedAt:crow.uploadedAt,pathname:crow.pathname}:{ready:false},
      festival:festival?{ready:true,uploadedAt:festival.uploadedAt,pathname:festival.pathname}:{ready:false}
    });
  }catch(error){
    console.error('Audio status failed',error);
    return res.status(500).json({error:'Audio status unavailable'});
  }
}
