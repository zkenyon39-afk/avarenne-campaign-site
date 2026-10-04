import { list, put } from '@vercel/blob';
const fallback={
  "campaignKicker": "A TALE FROM THE BORDERLANDS",
  "campaignTitle": "AVARENNE",
  "campaignSubtitle": "Kingdom before brother, Glory above all",
  "titleKickerFont": "\"Cinzel\", Georgia, serif",
  "titleMainFont": "\"Cinzel\", Georgia, serif",
  "titleSubFont": "\"Cormorant Garamond\", Georgia, serif",
  "titleKickerSize": 12,
  "titleSize": 118,
  "titleSubSize": 30,
  "titleSpacing": 13,
  "preludeKicker": "Trouble is stirring",
  "preludeTitle": "War Looms in the North",
  "preludeKickerFont": "\"Cinzel\", Georgia, serif",
  "preludeTitleFont": "\"Cormorant Garamond\", Georgia, serif",
  "preludeBodyFont": "\"Cormorant Garamond\", Georgia, serif",
  "preludeKickerSize": 12,
  "preludeTitleSize": 82,
  "preludeBodySize": 28,
  "preludeBody": "For generations, the kingdoms of Avarenne and Veyland have but tolerated each other's existance. It would seem their patience has reached its end.\n\nRumor tells that the forces of the north march from Ravenholt, bound for the ancient battlefields of the Grey Marches, seeking once and for all the destruction of Highmere.\n\nAs war looms over the kingdom, tensions rise. And while many dread the coming conflict, others see opportunity...\n\nBut in the lands to the south, trouble is far from thought.",
  "pressingKicker": "On the road to Briarwick",
  "pressingTitle": "The First Pressing",
  "pressingBody": "Beyond the Woldwood, the orchards of Briarwick are heavy with fruit.\n\nFor three nights the roads fill with lanterns, music, cider, and strangers.\n\nNot all of them have come to celebrate.",
  "pressingKickerFont": "\"Cinzel\", Georgia, serif",
  "pressingTitleFont": "\"Cormorant Garamond\", Georgia, serif",
  "pressingBodyFont": "\"Cormorant Garamond\", Georgia, serif",
  "countdownLabelFont": "\"Cinzel\", Georgia, serif",
  "countdownNumberFont": "\"Cinzel\", Georgia, serif",
  "pressingKickerSize": 12,
  "pressingTitleSize": 82,
  "pressingBodySize": 31,
  "countdownLabelSize": 14,
  "countdownNumberSize": 57,
  "countdownLabel": "The festival begins",
  "targetDate": "2026-10-18T19:00",
  "lineDelay": 5,
  "emberCount": 190,
  "smokeAmount": 58,
  "titleHold": 5,
  "preludeHold": 10,
  "currentScene": "title"
};
const allowed=new Set(Object.keys(fallback));
function clean(input={}){const out={...fallback};for(const [k,v] of Object.entries(input||{}))if(allowed.has(k))out[k]=v;out.currentScene='title';return out}
async function latest(){const result=await list({prefix:'campaign/settings',limit:100,token:process.env.BLOB_READ_WRITE_TOKEN});const blobs=[...(result.blobs||[])].sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));if(!blobs.length)return null;const r=await fetch(blobs[0].url,{cache:'no-store'});if(!r.ok)return null;return await r.json()}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method==='GET'){try{return res.status(200).json(clean((await latest())||fallback))}catch(e){console.error(e);return res.status(200).json(fallback)}}
  if(req.method==='POST'){const auth=req.headers.authorization||'';if(auth!==`Bearer ${process.env.INTERNAL_ADMIN_SECRET}`)return res.status(401).json({error:'Unauthorized'});try{const data=clean(req.body);const blob=await put('campaign/settings.json',JSON.stringify(data),{access:'public',addRandomSuffix:true,contentType:'application/json',cacheControlMaxAge:60,token:process.env.BLOB_READ_WRITE_TOKEN});return res.status(200).json({ok:true,updatedAt:new Date().toISOString(),url:blob.url})}catch(e){console.error(e);return res.status(500).json({error:'Publish failed'})}}
  res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'})
}