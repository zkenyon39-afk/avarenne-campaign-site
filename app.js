(() => {
  const $=id=>document.getElementById(id);
  const qsa=sel=>[...document.querySelectorAll(sel)];
  const defaults={
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
  let s={...defaults},targetDate=0,sequenceToken=0,revealTimers=[];

  async function loadPublished(){
    try{
      const r=await fetch('/api/settings',{cache:'no-store'});
      if(!r.ok) throw new Error('settings '+r.status);
      const data=await r.json();
      s={...defaults,...data,currentScene:'title'};
    }catch(e){
      console.warn('Using embedded campaign settings.',e);
      s={...defaults,currentScene:'title'};
    }
  }
  function buildBrand(replay=false){
    const el=$('campaignTitleDisplay');el.innerHTML='';
    [...s.campaignTitle].forEach((ch,i)=>{const span=document.createElement('span');span.textContent=ch===' '?' ':ch;span.style.animationDelay=(.5+i*.085)+'s';el.appendChild(span)});
    if(replay){const wrap=$('brandReveal');wrap.classList.remove('brand-reveal');void wrap.offsetWidth;wrap.classList.add('brand-reveal')}
  }
  function buildParagraphReveal(holderId,text,reveal=true){
    revealTimers.forEach(clearTimeout);revealTimers=[];const holder=$(holderId);holder.innerHTML='';
    const paras=text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
    paras.forEach((txt,i)=>{const div=document.createElement('div');div.className='teaser-line';div.textContent=txt;div.style.marginTop=i?'1.05em':'0';holder.appendChild(div);if(reveal)revealTimers.push(setTimeout(()=>div.classList.add('visible'),350+i*s.lineDelay*1000));else div.classList.add('visible')});
  }
  function apply(){
    $('campaignKickerDisplay').textContent=s.campaignKicker;$('campaignSubtitleDisplay').textContent=s.campaignSubtitle;
    $('preludeKickerDisplay').textContent=s.preludeKicker;$('preludeTitleDisplay').textContent=s.preludeTitle;
    $('pressingKickerDisplay').textContent=s.pressingKicker;$('pressingTitleDisplay').textContent=s.pressingTitle;$('countdownLabelDisplay').textContent=s.countdownLabel;
    const r=document.documentElement.style;
    [['--title-kicker-font','titleKickerFont'],['--title-main-font','titleMainFont'],['--title-sub-font','titleSubFont'],['--prelude-kicker-font','preludeKickerFont'],['--prelude-title-font','preludeTitleFont'],['--prelude-body-font','preludeBodyFont'],['--pressing-kicker-font','pressingKickerFont'],['--pressing-title-font','pressingTitleFont'],['--pressing-body-font','pressingBodyFont'],['--countdown-label-font','countdownLabelFont'],['--countdown-number-font','countdownNumberFont']].forEach(([v,k])=>r.setProperty(v,s[k]));
    [['--title-kicker-size','titleKickerSize'],['--title-size','titleSize'],['--title-sub-size','titleSubSize'],['--prelude-kicker-size','preludeKickerSize'],['--prelude-title-size','preludeTitleSize'],['--prelude-body-size','preludeBodySize'],['--pressing-kicker-size','pressingKickerSize'],['--pressing-title-size','pressingTitleSize'],['--pressing-body-size','pressingBodySize'],['--countdown-label-size','countdownLabelSize'],['--countdown-number-size','countdownNumberSize']].forEach(([v,k])=>r.setProperty(v,s[k]+'px'));
    r.setProperty('--title-spacing',(s.titleSpacing/100)+'em');$('smoke').style.opacity=(s.smokeAmount/100)*.95;targetDate=new Date(s.targetDate).getTime();
    $('brandReveal').style.opacity='0';
    buildBrand(false);buildParagraphReveal('preludeLines',s.preludeBody,false);buildParagraphReveal('pressingLines',s.pressingBody,false);rebuildEmbers();showScene('title',false);
  }
  const sceneOrder=['title','prelude','firstpressing'];
  function showScene(name,replay=true){qsa('.scene').forEach(x=>x.classList.toggle('active',x.id==='scene-'+name));if(name==='title'&&replay)buildBrand(true);if(name==='prelude')buildParagraphReveal('preludeLines',s.preludeBody,replay);if(name==='firstpressing')buildParagraphReveal('pressingLines',s.pressingBody,replay)}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function revealDuration(text){const count=Math.max(1,text.split(/\n\s*\n/).filter(x=>x.trim()).length);return 350+(count-1)*s.lineDelay*1000+1500}
  async function runOpening(){const token=++sequenceToken;$('brandReveal').style.opacity='';showScene('title',true);await sleep(s.titleHold*1000);if(token!==sequenceToken)return;showScene('prelude',true);await sleep(revealDuration(s.preludeBody)+s.preludeHold*1000);if(token!==sequenceToken)return;showScene('firstpressing',true)}
  function updateCountdown(){let diff=targetDate-Date.now();if(!Number.isFinite(diff)){$('countdown').innerHTML='SET A DATE';return}if(diff<=0){$('countdown').innerHTML='THE HOUR HAS COME';return}const d=Math.floor(diff/86400000);diff%=86400000;const h=Math.floor(diff/3600000);diff%=3600000;const m=Math.floor(diff/60000);const sec=Math.floor((diff%60000)/1000);const pad=n=>String(n).padStart(2,'0');$('countdown').innerHTML=`${pad(d)}<small>D</small> ${pad(h)}<small>H</small> ${pad(m)}<small>M</small> ${pad(sec)}<small>S</small>`}
  setInterval(updateCountdown,1000);

  const bg=$('background'),ctx=bg.getContext('2d');let particles=[],dpr=1;
  class Ember{constructor(){this.reset(false)}reset(low=true){this.x=Math.random()*innerWidth;this.y=low?innerHeight+Math.random()*90:Math.random()*innerHeight;this.r=.35+Math.random()*1.8;this.speed=.16+Math.random()*.8;this.drift=(Math.random()-.5)*.2;this.phase=Math.random()*Math.PI*2;this.flick=.4+Math.random()*.7;this.hue=18+Math.random()*25}step(t){this.y-=this.speed;this.x+=this.drift+Math.sin(t*.00055+this.phase)*.12;if(this.y<-15||this.x<-30||this.x>innerWidth+30)this.reset(true)}draw(t){const flick=.25+Math.abs(Math.sin(t*.004*this.flick+this.phase))*.75;const boost=.18+.82*Math.pow(Math.max(0,this.y/innerHeight),1.5);const a=Math.min(.82,flick*boost*.68);ctx.beginPath();ctx.fillStyle=`hsla(${this.hue},94%,62%,${a})`;ctx.shadowColor=`hsla(${this.hue},100%,55%,${a})`;ctx.shadowBlur=this.r*7;ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill()}}
  function resize(){dpr=Math.min(devicePixelRatio||1,2);bg.width=innerWidth*dpr;bg.height=innerHeight*dpr;bg.style.width=innerWidth+'px';bg.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);resizeSmoke()}
  function rebuildEmbers(){particles=Array.from({length:Number(s.emberCount)||90},()=>new Ember())}
  function animate(t){ctx.clearRect(0,0,innerWidth,innerHeight);const glow=ctx.createRadialGradient(innerWidth*.5,innerHeight*1.06,0,innerWidth*.5,innerHeight*1.06,innerHeight*.76);glow.addColorStop(0,'rgba(135,43,11,.16)');glow.addColorStop(.3,'rgba(61,19,7,.06)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,innerWidth,innerHeight);particles.forEach(p=>{p.step(t);p.draw(t)});ctx.shadowBlur=0;requestAnimationFrame(animate)}
  const sc=$('smoke'),sctx=sc.getContext('2d');let smokePuffs=[];
  function resizeSmoke(){sc.width=innerWidth*dpr;sc.height=innerHeight*dpr;sc.style.width=innerWidth+'px';sc.style.height=innerHeight+'px';sctx.setTransform(dpr,0,0,dpr,0,0);smokePuffs=Array.from({length:10},()=>({x:Math.random()*innerWidth,y:innerHeight*(.42+Math.random()*.55),r:110+Math.random()*220,vx:(Math.random()-.5)*.035,vy:-.012-Math.random()*.025,a:.018+Math.random()*.022,phase:Math.random()*6.28}))}
  function animateSmoke(t){sctx.clearRect(0,0,innerWidth,innerHeight);smokePuffs.forEach(p=>{p.x+=p.vx+Math.sin(t*.00012+p.phase)*.025;p.y+=p.vy;if(p.x<-p.r)p.x=innerWidth+p.r;if(p.x>innerWidth+p.r)p.x=-p.r;if(p.y<-p.r)p.y=innerHeight+p.r;const g=sctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,`rgba(160,145,128,${p.a})`);g.addColorStop(.45,`rgba(100,94,86,${p.a*.55})`);g.addColorStop(1,'rgba(0,0,0,0)');sctx.fillStyle=g;sctx.beginPath();sctx.arc(p.x,p.y,p.r,0,Math.PI*2);sctx.fill()});requestAnimationFrame(animateSmoke)}
  window.addEventListener('resize',()=>{resize();rebuildEmbers()});
  async function init(){resize();await loadPublished();apply();updateCountdown();requestAnimationFrame(animate);requestAnimationFrame(animateSmoke);setTimeout(()=>runOpening(),650)}
  init();
})();