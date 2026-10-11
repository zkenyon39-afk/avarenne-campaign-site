const tracks={
  crow:'https://pixabay.com/music/instrumental-crow-at-the-gallows-gate-470050/',
  festival:'https://pixabay.com/music/folk-medieval-celtic-violin-244699/'
};

const cache=new Map();

function findContentUrl(value){
  if(!value)return null;
  if(typeof value==='object'){
    if(typeof value.contentUrl==='string'&&value.contentUrl.includes('cdn.pixabay.com'))return value.contentUrl;
    for(const child of Object.values(value)){
      const found=findContentUrl(child);
      if(found)return found;
    }
  }
  return null;
}

function decodeCandidate(raw){
  if(!raw)return null;
  let value=raw.replace(/&amp;/g,'&').replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
  try{value=JSON.parse('"'+value.replace(/"/g,'\\"')+'"')}catch{}
  return value;
}

async function resolveTrack(key){
  if(cache.has(key))return cache.get(key);
  const page=tracks[key];
  if(!page)throw new Error('Unknown track');
  const response=await fetch(page,{
    headers:{
      'User-Agent':'Mozilla/5.0 (compatible; AvarenneCampaign/1.0)',
      'Accept':'text/html,application/xhtml+xml'
    }
  });
  if(!response.ok)throw new Error(`Pixabay page ${response.status}`);
  const html=await response.text();

  for(const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const found=findContentUrl(JSON.parse(match[1]));
      if(found){cache.set(key,found);return found}
    }catch{}
  }

  const contentMatch=html.match(/"contentUrl"\s*:\s*"([^"]+)"/i);
  if(contentMatch){
    const found=decodeCandidate(contentMatch[1]);
    if(found&&found.includes('cdn.pixabay.com')){cache.set(key,found);return found}
  }

  const cdnMatch=html.match(/https?:\\?\/\\?\/cdn\.pixabay\.com\/[^"'<\s]+?\.mp3[^"'<\s]*/i);
  if(cdnMatch){
    const found=decodeCandidate(cdnMatch[0]);
    cache.set(key,found);return found;
  }
  throw new Error('Could not locate Pixabay audio source');
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).end();
  }
  const key=Array.isArray(req.query.track)?req.query.track[0]:req.query.track;
  if(!tracks[key])return res.status(404).json({error:'Unknown track'});
  try{
    const target=await resolveTrack(key);
    res.setHeader('Cache-Control','public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Location',target);
    return res.status(302).end();
  }catch(error){
    console.error('Audio resolve failed',key,error);
    return res.status(502).json({error:'Audio unavailable'});
  }
}
