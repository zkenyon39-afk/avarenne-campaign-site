(() => {
  const NativeAudio = window.Audio;

  const WAR_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/crow/Avarenne_War_Cue_Crow_at_the_Gallows_Gate_128k-er8YtbMXUKkM0bQtXw9kudLSVyQ2uW.mp3';
  const FESTIVAL_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/festival/Avarenne_Festival_Cue_Medieval_Celtic_Violin_128k-xJA8DzV0kYNCemDHm3gxlmytX2Ld7G.mp3';

  const WAR_VOLUME = 0.72;
  const FESTIVAL_VOLUME = 0.58;
  const WAR_FADE_SEC = 1.2;
  const WAR_OUT_SEC = 2.2;
  const WAR_FADE_LEAD_SEC = 1.25;
  const TRANSITION_PAUSE_SEC = 0.45;
  const FESTIVAL_IN_SEC = 2.2;
  const POST_LAST_PARAGRAPH_SEC = 1.5;

  // app.js still creates its old /api/audio media objects. Make only those
  // objects inert; the real soundtrack below is handled entirely by Web Audio.
  function isLegacyCampaignAudio(src = '') {
    const value = String(src);
    return value.includes('/api/audio') && (value.includes('track=crow') || value.includes('track=festival'));
  }

  function makeDummyAudio() {
    let currentTime = 0;
    let volume = 0;
    let preload = 'auto';
    let loop = false;
    return {
      play() { return Promise.resolve(); },
      pause() {},
      load() {},
      get currentTime() { return currentTime; },
      set currentTime(v) { currentTime = Number(v) || 0; },
      get volume() { return volume; },
      set volume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); },
      get preload() { return preload; },
      set preload(v) { preload = v; },
      get loop() { return loop; },
      set loop(v) { loop = !!v; },
      get paused() { return false; },
      get ended() { return false; },
      get readyState() { return 4; }
    };
  }

  function CampaignAudioShim(src) {
    if (isLegacyCampaignAudio(src)) return makeDummyAudio();
    return new NativeAudio(src);
  }
  CampaignAudioShim.prototype = NativeAudio.prototype;
  window.Audio = CampaignAudioShim;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let armed = false;
  let buffersPromise = null;
  let warSource = null;
  let festivalSource = null;
  let warGain = null;
  let festivalGain = null;
  let warStarted = false;
  let festivalStarted = false;
  let warExitStarted = false;
  let warExitEndsAt = 0;
  let warExitTimer = null;
  let preludeHoldSec = 10;

  const preludeActive = () => document.getElementById('scene-prelude')?.classList.contains('active');
  const pressingActive = () => document.getElementById('scene-firstpressing')?.classList.contains('active');

  fetch('/api/settings', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const value = Number(data?.preludeHold);
      if (Number.isFinite(value)) preludeHoldSec = value;
    })
    .catch(() => {});

  async function fetchBuffer(url) {
    const response = await fetch(url, { cache: 'force-cache', mode: 'cors' });
    if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`);
    const data = await response.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  }

  function loadBuffers() {
    if (!buffersPromise) {
      buffersPromise = Promise.all([
        fetchBuffer(WAR_SRC),
        fetchBuffer(FESTIVAL_SRC)
      ]).then(([war, festival]) => ({ war, festival }));
    }
    return buffersPromise;
  }

  function makeSource(buffer, gainValue = 0) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    source.connect(gain).connect(ctx.destination);
    return { source, gain };
  }

  async function armAudio() {
    if (armed) return;
    armed = true;
    ctx = new AudioContextCtor();
    try { await ctx.resume(); } catch {}
    loadBuffers().then(syncToScene).catch(err => console.warn('Campaign soundtrack failed to load.', err));
  }

  async function startWar() {
    if (!armed || warStarted || festivalStarted) return;
    const { war } = await loadBuffers();
    if (warStarted || festivalStarted || !preludeActive()) return;
    warStarted = true;

    const node = makeSource(war, 0);
    warSource = node.source;
    warGain = node.gain;
    warSource.start(0, 0);

    const now = ctx.currentTime;
    warGain.gain.cancelScheduledValues(now);
    warGain.gain.setValueAtTime(0, now);
    warGain.gain.linearRampToValueAtTime(WAR_VOLUME, now + WAR_FADE_SEC);
  }

  function beginWarExit() {
    if (!ctx || warExitStarted || !warGain) return;
    warExitStarted = true;

    const now = ctx.currentTime;
    const param = warGain.gain;
    const current = Math.max(0.0001, param.value || WAR_VOLUME);

    if (typeof param.cancelAndHoldAtTime === 'function') {
      try { param.cancelAndHoldAtTime(now); } catch {
        param.cancelScheduledValues(now);
        param.setValueAtTime(current, now);
      }
    } else {
      param.cancelScheduledValues(now);
      param.setValueAtTime(current, now);
    }

    param.linearRampToValueAtTime(0.0001, now + WAR_OUT_SEC);
    warExitEndsAt = now + WAR_OUT_SEC;

    if (warSource) {
      try { warSource.stop(warExitEndsAt + 0.05); } catch {}
    }
  }

  function scheduleEarlyWarExit() {
    if (!armed || warExitStarted || warExitTimer || !preludeActive()) return;

    const holder = document.getElementById('preludeLines');
    const lines = holder ? [...holder.querySelectorAll('.teaser-line')] : [];
    const last = lines[lines.length - 1];
    if (!last?.classList.contains('visible')) return;

    // app.js changes scenes 1.5s + preludeHold after the final paragraph appears.
    // Begin the darker cue's fade 1.25s before that scene change, so the music
    // is already receding as Briarwick arrives without depending on paragraph timing.
    const waitMs = Math.max(
      0,
      (POST_LAST_PARAGRAPH_SEC + preludeHoldSec - WAR_FADE_LEAD_SEC) * 1000
    );

    warExitTimer = setTimeout(() => {
      warExitTimer = null;
      if (preludeActive() && !pressingActive()) beginWarExit();
    }, waitMs);
  }

  async function startFestivalTransition() {
    if (!armed || festivalStarted) return;
    const { festival } = await loadBuffers();
    if (festivalStarted || !pressingActive()) return;
    festivalStarted = true;

    // If the early cue somehow did not fire, gracefully fall back to fading Crow
    // here rather than allowing the two tracks to collide.
    if (!warExitStarted) beginWarExit();

    const now = ctx.currentTime;
    const warEnd = warExitEndsAt > now ? warExitEndsAt : now;
    const festivalStart = warEnd + TRANSITION_PAUSE_SEC;

    const node = makeSource(festival, 0);
    festivalSource = node.source;
    festivalGain = node.gain;
    festivalGain.gain.cancelScheduledValues(now);
    festivalGain.gain.setValueAtTime(0, now);
    festivalGain.gain.setValueAtTime(0, festivalStart);
    festivalGain.gain.linearRampToValueAtTime(FESTIVAL_VOLUME, festivalStart + FESTIVAL_IN_SEC);
    festivalSource.start(festivalStart, 0);
  }

  function syncToScene() {
    if (!armed || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (pressingActive()) {
      startFestivalTransition();
    } else if (preludeActive()) {
      startWar();
      scheduleEarlyWarExit();
    }
  }

  // The user's Enter click is the only gesture needed. It unlocks the
  // AudioContext and begins loading both tracks before the War Looms scene.
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.avarenne-entry-button')) return;
    armAudio();
  }, true);

  const observer = new MutationObserver(syncToScene);
  const preludeScene = document.getElementById('scene-prelude');
  const pressingScene = document.getElementById('scene-firstpressing');
  const preludeLines = document.getElementById('preludeLines');
  if (preludeScene) observer.observe(preludeScene, { attributes: true, attributeFilter: ['class'] });
  if (pressingScene) observer.observe(pressingScene, { attributes: true, attributeFilter: ['class'] });
  if (preludeLines) observer.observe(preludeLines, { attributes: true, subtree: true, childList: true, attributeFilter: ['class'] });

  // A tiny fallback loop catches any scene or paragraph reveal that lands
  // between async decode completion and a MutationObserver callback.
  setInterval(syncToScene, 250);
})();