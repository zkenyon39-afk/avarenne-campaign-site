(() => {
  const $ = id => document.getElementById(id);
  const qsa = sel => [...document.querySelectorAll(sel)];

  const future = () => {
    const d = new Date();
    d.setDate(d.getDate()+14); d.setHours(19,0,0,0);
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  };

  const defaults = {
    campaignKicker:"A TALE FROM THE BORDERLANDS",
    campaignTitle:"AVARENNE",
    campaignSubtitle:"Where old roads end, old promises remain.",
    titleKickerFont:'"Cinzel", Georgia, serif',
    titleMainFont:'"Cinzel", Georgia, serif',
    titleSubFont:'"Cormorant Garamond", Georgia, serif',
    titleKickerSize:12,
    titleSize:118,
    titleSubSize:30,
    titleSpacing:13,

    preludeKicker:"ON THE ROAD TO BRIARWICK",
    preludeTitle:"Before the Lanterns Are Lit",
    preludeKickerFont:'"Cinzel", Georgia, serif',
    preludeTitleFont:'"Cormorant Garamond", Georgia, serif',
    preludeBodyFont:'"Cormorant Garamond", Georgia, serif',
    preludeKickerSize:12,
    preludeTitleSize:82,
    preludeBodySize:31,
    preludeBody:`The roads are fuller than they should be.

Farm carts, pilgrims, merchants, musicians — all of them moving toward the same little town.

And somewhere among them, something else is coming.`,

    pressingKicker:"BRIARWICK · THE FIRST PRESSING",
    pressingTitle:"The First Pressing",
    pressingBody:`Beyond the Woldwood, the orchards of Briarwick are heavy with fruit.

For three nights the roads fill with lanterns, music, cider, and strangers.

Not all of them have come to celebrate.`,

    pressingKickerFont:'"Cinzel", Georgia, serif',
    pressingTitleFont:'"Cormorant Garamond", Georgia, serif',
    pressingBodyFont:'"Cormorant Garamond", Georgia, serif',
    countdownLabelFont:'"Cinzel", Georgia, serif',
    countdownNumberFont:'"Cinzel", Georgia, serif',
    pressingKickerSize:12,
    pressingTitleSize:82,
    pressingBodySize:31,
    countdownLabelSize:11,
    countdownNumberSize:48,
    countdownLabel:"UNTIL THE FIRST PRESSING",
    targetDate:future(),

    lineDelay:2.8,

    emberCount:90,
    smokeAmount:58,
    titleHold:5,
    preludeHold:6,
    currentScene:"title"
  };

  function load(){
    try{return {...defaults,...JSON.parse(localStorage.getItem("avarenneDisplayV3")||"{}")}}
    catch{return {...defaults}}
  }

  let s=load(), targetDate=0, sequenceToken=0, revealTimers=[];

  function save(){ localStorage.setItem("avarenneDisplayV3",JSON.stringify(s)); }

  function buildBrand(replay=false){
    const el=$("campaignTitleDisplay");
    el.innerHTML="";
    [...s.campaignTitle].forEach((ch,i)=>{
      const span=document.createElement("span");
      span.textContent=ch===" "?"\u00A0":ch;
      span.style.animationDelay=(.5+i*.085)+"s";
      el.appendChild(span);
    });
    if(replay){
      const wrap=$("brandReveal");
      wrap.classList.remove("brand-reveal");
      void wrap.offsetWidth;
      wrap.classList.add("brand-reveal");
    }
  }

  function buildParagraphReveal(holderId,text,reveal=true){
    revealTimers.forEach(clearTimeout); revealTimers=[];
    const holder=$(holderId);
    holder.innerHTML="";
    const paras=text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);

    paras.forEach((txt,i)=>{
      const div=document.createElement("div");
      div.className="teaser-line";
      div.textContent=txt;
      div.style.marginTop=i?"1.05em":"0";
      holder.appendChild(div);

      if(reveal){
        revealTimers.push(setTimeout(()=>div.classList.add("visible"),350+i*s.lineDelay*1000));
      } else {
        div.classList.add("visible");
      }
    });
  }

  function apply(){
    const values = {
      campaignKickerInput:s.campaignKicker,
      campaignTitleInput:s.campaignTitle,
      campaignSubtitleInput:s.campaignSubtitle,
      titleKickerFontSelect:s.titleKickerFont,
      titleMainFontSelect:s.titleMainFont,
      titleSubFontSelect:s.titleSubFont,
      titleKickerSize:s.titleKickerSize,
      titleSize:s.titleSize,
      titleSubSize:s.titleSubSize,
      titleSpacing:s.titleSpacing,
      preludeKickerInput:s.preludeKicker,
      preludeTitleInput:s.preludeTitle,
      preludeBodyInput:s.preludeBody,
      preludeKickerFontSelect:s.preludeKickerFont,
      preludeTitleFontSelect:s.preludeTitleFont,
      preludeBodyFontSelect:s.preludeBodyFont,
      preludeKickerSize:s.preludeKickerSize,
      preludeTitleSize:s.preludeTitleSize,
      preludeBodySize:s.preludeBodySize,
      pressingKickerInput:s.pressingKicker,
      pressingTitleInput:s.pressingTitle,
      pressingBodyInput:s.pressingBody,
      countdownLabelInput:s.countdownLabel,
      dateInput:s.targetDate,
      pressingKickerFontSelect:s.pressingKickerFont,
      pressingTitleFontSelect:s.pressingTitleFont,
      pressingBodyFontSelect:s.pressingBodyFont,
      countdownLabelFontSelect:s.countdownLabelFont,
      countdownNumberFontSelect:s.countdownNumberFont,
      pressingKickerSize:s.pressingKickerSize,
      pressingTitleSize:s.pressingTitleSize,
      pressingBodySize:s.pressingBodySize,
      countdownLabelSize:s.countdownLabelSize,
      countdownNumberSize:s.countdownNumberSize,
      lineDelayInput:s.lineDelay,
      emberRange:s.emberCount,
      smokeRange:s.smokeAmount,
      titleHoldInput:s.titleHold,
      preludeHoldInput:s.preludeHold
    };
    for(const [id,val] of Object.entries(values)) $(id).value=val;

    $("campaignKickerDisplay").textContent=s.campaignKicker;
    $("campaignSubtitleDisplay").textContent=s.campaignSubtitle;
    $("preludeKickerDisplay").textContent=s.preludeKicker;
    $("preludeTitleDisplay").textContent=s.preludeTitle;
    $("pressingKickerDisplay").textContent=s.pressingKicker;
    $("pressingTitleDisplay").textContent=s.pressingTitle;
    $("countdownLabelDisplay").textContent=s.countdownLabel;

    document.documentElement.style.setProperty("--title-kicker-font",s.titleKickerFont);
    document.documentElement.style.setProperty("--title-main-font",s.titleMainFont);
    document.documentElement.style.setProperty("--title-sub-font",s.titleSubFont);
    document.documentElement.style.setProperty("--prelude-kicker-font",s.preludeKickerFont);
    document.documentElement.style.setProperty("--prelude-title-font",s.preludeTitleFont);
    document.documentElement.style.setProperty("--prelude-body-font",s.preludeBodyFont);
    document.documentElement.style.setProperty("--pressing-kicker-font",s.pressingKickerFont);
    document.documentElement.style.setProperty("--pressing-title-font",s.pressingTitleFont);
    document.documentElement.style.setProperty("--pressing-body-font",s.pressingBodyFont);
    document.documentElement.style.setProperty("--countdown-label-font",s.countdownLabelFont);
    document.documentElement.style.setProperty("--countdown-number-font",s.countdownNumberFont);

    document.documentElement.style.setProperty("--title-kicker-size",s.titleKickerSize+"px");
    document.documentElement.style.setProperty("--title-size",s.titleSize+"px");
    document.documentElement.style.setProperty("--title-sub-size",s.titleSubSize+"px");

    document.documentElement.style.setProperty("--prelude-kicker-size",s.preludeKickerSize+"px");
    document.documentElement.style.setProperty("--prelude-title-size",s.preludeTitleSize+"px");
    document.documentElement.style.setProperty("--prelude-body-size",s.preludeBodySize+"px");

    document.documentElement.style.setProperty("--pressing-kicker-size",s.pressingKickerSize+"px");
    document.documentElement.style.setProperty("--pressing-title-size",s.pressingTitleSize+"px");
    document.documentElement.style.setProperty("--pressing-body-size",s.pressingBodySize+"px");
    document.documentElement.style.setProperty("--countdown-label-size",s.countdownLabelSize+"px");
    document.documentElement.style.setProperty("--countdown-number-size",s.countdownNumberSize+"px");

    document.documentElement.style.setProperty("--title-spacing",(s.titleSpacing/100)+"em");

    $("smoke").style.opacity=(s.smokeAmount/100)*.95;
    targetDate=new Date(s.targetDate).getTime();

    buildBrand(false);
    buildParagraphReveal("preludeLines",s.preludeBody,false);
    buildParagraphReveal("pressingLines",s.pressingBody,false);
    rebuildEmbers();
    showScene(s.currentScene,false);
  }

  function bindText(key,inputId,displayId=null,extra=null){
    $(inputId).addEventListener("input",e=>{
      s[key]=e.target.value;
      if(displayId) $(displayId).textContent=s[key];
      if(extra) extra();
      save();
    });
  }

  bindText("campaignKicker","campaignKickerInput","campaignKickerDisplay");
  bindText("campaignTitle","campaignTitleInput",null,()=>buildBrand(true));
  bindText("campaignSubtitle","campaignSubtitleInput","campaignSubtitleDisplay");

  bindText("preludeKicker","preludeKickerInput","preludeKickerDisplay");
  bindText("preludeTitle","preludeTitleInput","preludeTitleDisplay");
  bindText("preludeBody","preludeBodyInput",null,()=>buildParagraphReveal("preludeLines",s.preludeBody,false));

  bindText("pressingKicker","pressingKickerInput","pressingKickerDisplay");
  bindText("pressingTitle","pressingTitleInput","pressingTitleDisplay");
  bindText("pressingBody","pressingBodyInput",null,()=>buildParagraphReveal("pressingLines",s.pressingBody,false));

  bindText("countdownLabel","countdownLabelInput","countdownLabelDisplay");


  function bindFont(selectId,key,cssVar){
    $(selectId).addEventListener("input",e=>{
      s[key]=e.target.value;
      document.documentElement.style.setProperty(cssVar,s[key]);
      save();
    });
  }

  bindFont("titleKickerFontSelect","titleKickerFont","--title-kicker-font");
  bindFont("titleMainFontSelect","titleMainFont","--title-main-font");
  bindFont("titleSubFontSelect","titleSubFont","--title-sub-font");

  bindFont("preludeKickerFontSelect","preludeKickerFont","--prelude-kicker-font");
  bindFont("preludeTitleFontSelect","preludeTitleFont","--prelude-title-font");
  bindFont("preludeBodyFontSelect","preludeBodyFont","--prelude-body-font");

  bindFont("pressingKickerFontSelect","pressingKickerFont","--pressing-kicker-font");
  bindFont("pressingTitleFontSelect","pressingTitleFont","--pressing-title-font");
  bindFont("pressingBodyFontSelect","pressingBodyFont","--pressing-body-font");
  bindFont("countdownLabelFontSelect","countdownLabelFont","--countdown-label-font");
  bindFont("countdownNumberFontSelect","countdownNumberFont","--countdown-number-font");

  function bindSize(inputId,key,cssVar){
    $(inputId).addEventListener("input",e=>{
      s[key]=Number(e.target.value);
      document.documentElement.style.setProperty(cssVar,s[key]+"px");
      save();
    });
  }

  bindSize("titleKickerSize","titleKickerSize","--title-kicker-size");
  bindSize("titleSubSize","titleSubSize","--title-sub-size");

  bindSize("preludeKickerSize","preludeKickerSize","--prelude-kicker-size");
  bindSize("preludeTitleSize","preludeTitleSize","--prelude-title-size");
  bindSize("preludeBodySize","preludeBodySize","--prelude-body-size");

  bindSize("pressingKickerSize","pressingKickerSize","--pressing-kicker-size");
  bindSize("pressingTitleSize","pressingTitleSize","--pressing-title-size");
  bindSize("pressingBodySize","pressingBodySize","--pressing-body-size");
  bindSize("countdownLabelSize","countdownLabelSize","--countdown-label-size");
  bindSize("countdownNumberSize","countdownNumberSize","--countdown-number-size");

  $("titleSize").addEventListener("input",e=>{
    s.titleSize=Number(e.target.value);
    document.documentElement.style.setProperty("--title-size",s.titleSize+"px");
    save();
  });

  $("titleSpacing").addEventListener("input",e=>{
    s.titleSpacing=Number(e.target.value);
    document.documentElement.style.setProperty("--title-spacing",(s.titleSpacing/100)+"em");
    save();
  });

  $("lineDelayInput").addEventListener("input",e=>{s.lineDelay=Number(e.target.value);save()});
  $("dateInput").addEventListener("input",e=>{
    s.targetDate=e.target.value;
    targetDate=new Date(s.targetDate).getTime();
    save();
  });

  $("emberRange").addEventListener("input",e=>{
    s.emberCount=Number(e.target.value);
    rebuildEmbers();
    save();
  });

  $("smokeRange").addEventListener("input",e=>{
    s.smokeAmount=Number(e.target.value);
    $("smoke").style.opacity=(s.smokeAmount/100)*.95;
    save();
  });

  $("titleHoldInput").addEventListener("input",e=>{s.titleHold=Number(e.target.value);save()});
  $("preludeHoldInput").addEventListener("input",e=>{s.preludeHold=Number(e.target.value);save()});

  const sceneOrder=["title","prelude","firstpressing"];

  function showScene(name,replay=true){
    if(!sceneOrder.includes(name)) name="title";
    s.currentScene=name;
    save();

    qsa(".scene").forEach(x=>x.classList.toggle("active",x.id==="scene-"+name));
    qsa("[data-scene]").forEach(x=>x.classList.toggle("active-btn",x.dataset.scene===name));

    if(name==="title"&&replay) buildBrand(true);
    if(name==="prelude") buildParagraphReveal("preludeLines",s.preludeBody,replay);
    if(name==="firstpressing") buildParagraphReveal("pressingLines",s.pressingBody,replay);

    toast(name==="firstpressing"?"First Pressing":name[0].toUpperCase()+name.slice(1));
  }

  qsa("[data-scene]").forEach(b=>b.addEventListener("click",()=>{
    sequenceToken++;
    showScene(b.dataset.scene,true);
  }));

  function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
  function revealDuration(text){
    const count=Math.max(1,text.split(/\n\s*\n/).filter(x=>x.trim()).length);
    return 350+(count-1)*s.lineDelay*1000+1500;
  }

  async function runOpening(){
    const token=++sequenceToken;

    showScene("title",true);
    await sleep(s.titleHold*1000);
    if(token!==sequenceToken)return;

    showScene("prelude",true);
    await sleep(revealDuration(s.preludeBody)+s.preludeHold*1000);
    if(token!==sequenceToken)return;

    showScene("firstpressing",true);
  }

  $("runSequence").addEventListener("click",runOpening);

  $("restartReveal").addEventListener("click",()=>{
    if(s.currentScene==="title") buildBrand(true);
    if(s.currentScene==="prelude") buildParagraphReveal("preludeLines",s.preludeBody,true);
    if(s.currentScene==="firstpressing") buildParagraphReveal("pressingLines",s.pressingBody,true);
  });

  $("togglePanel").addEventListener("click",()=>$("panel").classList.toggle("closed"));

  async function fullscreen(){
    document.body.classList.add("presentation");
    try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch{}
  }
  $("presentationBtn").addEventListener("click",fullscreen);

  document.addEventListener("keydown",e=>{
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;

    if(e.key>="1"&&e.key<="3"){
      sequenceToken++;
      showScene(sceneOrder[Number(e.key)-1],true);
    } else if(e.code==="Space"){
      e.preventDefault();
      sequenceToken++;
      showScene(sceneOrder[(sceneOrder.indexOf(s.currentScene)+1)%sceneOrder.length],true);
    } else if(e.key.toLowerCase()==="r"){
      runOpening();
    } else if(e.key.toLowerCase()==="f"){
      fullscreen();
    } else if(e.key==="Escape"){
      document.body.classList.remove("presentation");
    }
  });

  document.addEventListener("fullscreenchange",()=>{
    if(!document.fullscreenElement) document.body.classList.remove("presentation");
  });

  $("resetBtn").addEventListener("click",()=>{
    if(!confirm("Reset all campaign display text and settings?")) return;
    s={...defaults,targetDate:future()};
    save();
    apply();
    buildBrand(true);
    showScene("title",true);
  });

  let toastTimer;
  function toast(msg){
    const el=$("toast");
    el.textContent=msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove("show"),850);
  }

  function updateCountdown(){
    let diff=targetDate-Date.now();

    if(!Number.isFinite(diff)){
      $("countdown").innerHTML="SET A DATE";
      return;
    }

    if(diff<=0){
      $("countdown").innerHTML="THE HOUR HAS COME";
      return;
    }

    const d=Math.floor(diff/86400000); diff%=86400000;
    const h=Math.floor(diff/3600000); diff%=3600000;
    const m=Math.floor(diff/60000);
    const sec=Math.floor((diff%60000)/1000);
    const pad=n=>String(n).padStart(2,"0");

    $("countdown").innerHTML=
      `${pad(d)}<small>D</small> ${pad(h)}<small>H</small> ${pad(m)}<small>M</small> ${pad(sec)}<small>S</small>`;
  }
  setInterval(updateCountdown,1000);

  const bg=$("background"),ctx=bg.getContext("2d");
  let particles=[],dpr=1;

  class Ember{
    constructor(){this.reset(false)}
    reset(low=true){
      this.x=Math.random()*innerWidth;
      this.y=low?innerHeight+Math.random()*90:Math.random()*innerHeight;
      this.r=.35+Math.random()*1.8;
      this.speed=.16+Math.random()*.8;
      this.drift=(Math.random()-.5)*.2;
      this.phase=Math.random()*Math.PI*2;
      this.flick=.4+Math.random()*.7;
      this.hue=18+Math.random()*25;
    }
    step(t){
      this.y-=this.speed;
      this.x+=this.drift+Math.sin(t*.00055+this.phase)*.12;
      if(this.y<-15||this.x<-30||this.x>innerWidth+30)this.reset(true);
    }
    draw(t){
      const flick=.25+Math.abs(Math.sin(t*.004*this.flick+this.phase))*.75;
      const boost=.18+.82*Math.pow(Math.max(0,this.y/innerHeight),1.5);
      const a=Math.min(.82,flick*boost*.68);
      ctx.beginPath();
      ctx.fillStyle=`hsla(${this.hue},94%,62%,${a})`;
      ctx.shadowColor=`hsla(${this.hue},100%,55%,${a})`;
      ctx.shadowBlur=this.r*7;
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2);
    bg.width=innerWidth*dpr;
    bg.height=innerHeight*dpr;
    bg.style.width=innerWidth+"px";
    bg.style.height=innerHeight+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    resizeSmoke();
  }

  function rebuildEmbers(){
    particles=Array.from({length:Number(s.emberCount)||90},()=>new Ember());
  }

  function animate(t){
    ctx.clearRect(0,0,innerWidth,innerHeight);

    const glow=ctx.createRadialGradient(
      innerWidth*.5,innerHeight*1.06,0,
      innerWidth*.5,innerHeight*1.06,innerHeight*.76
    );
    glow.addColorStop(0,"rgba(135,43,11,.16)");
    glow.addColorStop(.3,"rgba(61,19,7,.06)");
    glow.addColorStop(1,"rgba(0,0,0,0)");

    ctx.fillStyle=glow;
    ctx.fillRect(0,0,innerWidth,innerHeight);

    particles.forEach(p=>{p.step(t);p.draw(t)});
    ctx.shadowBlur=0;
    requestAnimationFrame(animate);
  }

  const sc=$("smoke"),sctx=sc.getContext("2d");
  let smokePuffs=[];

  function resizeSmoke(){
    sc.width=innerWidth*dpr;
    sc.height=innerHeight*dpr;
    sc.style.width=innerWidth+"px";
    sc.style.height=innerHeight+"px";
    sctx.setTransform(dpr,0,0,dpr,0,0);

    smokePuffs=Array.from({length:10},()=>({
      x:Math.random()*innerWidth,
      y:innerHeight*(.42+Math.random()*.55),
      r:110+Math.random()*220,
      vx:(Math.random()-.5)*.035,
      vy:-.012-Math.random()*.025,
      a:.018+Math.random()*.022,
      phase:Math.random()*6.28
    }));
  }

  function animateSmoke(t){
    sctx.clearRect(0,0,innerWidth,innerHeight);

    smokePuffs.forEach(p=>{
      p.x+=p.vx+Math.sin(t*.00012+p.phase)*.025;
      p.y+=p.vy;

      if(p.x<-p.r)p.x=innerWidth+p.r;
      if(p.x>innerWidth+p.r)p.x=-p.r;
      if(p.y<-p.r)p.y=innerHeight+p.r;

      const g=sctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`rgba(160,145,128,${p.a})`);
      g.addColorStop(.45,`rgba(100,94,86,${p.a*.55})`);
      g.addColorStop(1,"rgba(0,0,0,0)");

      sctx.fillStyle=g;
      sctx.beginPath();
      sctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      sctx.fill();
    });

    requestAnimationFrame(animateSmoke);
  }

  window.addEventListener("resize",()=>{
    resize();
    rebuildEmbers();
  });

  resize();
  apply();
  updateCountdown();
  requestAnimationFrame(animate);
  requestAnimationFrame(animateSmoke);

  window.addEventListener("load",()=>{
    setTimeout(()=>runOpening(),650);
  });
})();