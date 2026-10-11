import { handleUpload } from '@vercel/blob/client';

const validTracks=new Set(['crow','festival']);

export default async function handler(req,res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed'});
  }
  const auth=req.headers.authorization||'';
  if(auth!==`Bearer ${process.env.INTERNAL_ADMIN_SECRET}`)return res.status(401).json({error:'Unauthorized'});
  try{
    const jsonResponse=await handleUpload({
      body:req.body,
      request:req,
      onBeforeGenerateToken:async(pathname,clientPayload)=>{
        const track=String(clientPayload||'');
        if(!validTracks.has(track))throw new Error('Invalid track');
        if(!pathname.startsWith(`campaign/audio/${track}/`))throw new Error('Invalid audio path');
        return {
          allowedContentTypes:['audio/mpeg','audio/mp4','audio/x-m4a','audio/m4a','video/mp4'],
          maximumSizeInBytes:20*1024*1024,
          addRandomSuffix:true,
          tokenPayload:track
        };
      },
      onUploadCompleted:async({blob,tokenPayload})=>{
        console.log('Campaign audio uploaded',tokenPayload,blob.pathname);
      }
    });
    return res.status(200).json(jsonResponse);
  }catch(error){
    console.error('Audio upload failed',error);
    return res.status(400).json({error:error?.message||'Upload failed'});
  }
}
