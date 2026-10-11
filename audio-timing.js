(() => {
  const NativeAudio = window.Audio;

  const WAR_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/crow/Avarenne_War_Cue_Crow_at_the_Gallows_Gate_128k-er8YtbMXUKkM0bQtXw9kudLSVyQ2uW.mp3';
  const FESTIVAL_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/festival/Avarenne_Festival_Cue_Medieval_Celtic_Violin_128k-xJA8DzV0kYNCemDHm3gxlmytX2Ld7G.mp3';

  const WAR_VOLUME = 0.72;
  const FESTIVAL_VOLUME = 0.58;
  const WAR_FADE_MS = 1200;
  const CROSSFADE_MS = 1500;

  // The old app still creates /api/audio objects and contains legacy cue logic.
  // Give those calls inert media objects so they cannot interfere with the real
  // campaign music controller below.
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

  // These are the only two real audio elements used by the page.
  const war = new NativeAudio(WAR_SRC);
  const festival = new NativeAudio(FESTIVAL_SRC);
  war.preload = 'auto';
  festival.preload = 'auto';
  festival.loop = true;
  war.volume = 0;
  festival.volume = 0;
  festival.muted = true;

  let armed = false;
  let warStarted = false;
  let festivalStarted = false;
  let fadeToken = 0;

  const preludeActive = () => document.getElementById('scene-prelude')?.classList.contains('active');
  const pressingActive = () => document.getElementById('scene-firstpressing')?.classList.contains('active');

  function playQuietly(audio) {
    const p = audio.play();
    if (p?.catch) p.catch(err => console.warn('Campaign audio unlock failed.', err));
  }

  function armRealAudio() {
    if (armed) return;
    armed = true;

    try { war.currentTime = 0; } catch {}
    try { festival.currentTime = 0; } catch {}
    war.volume = 0;
    festival.volume = 0;
    festival.muted = true;

    // Both elements begin during the user's explicit Enter click. They remain
    // inaudible until their scene cues, so later scene changes do not depend on
    // a new autoplay permission.
    playQuietly(war);
    playQuietly(festival);
  }

  function startWar() {
    if (!armed || warStarted || festivalStarted) return;
    warStarted = true;
    const token = ++fadeToken;

    try { war.currentTime = 0; } catch {}
    war.muted = false;
    war.volume = 0;
    if (war.paused) playQuietly(war);

    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken || festivalStarted) return;
      const x = Math.min(1, (now - started) / WAR_FADE_MS);
      war.volume = WAR_VOLUME * x;
      if (x < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function startFestivalTransition() {
    if (!armed || festivalStarted) return;
    festivalStarted = true;
    const token = ++fadeToken;

    const startingWarVolume = war.volume;
    try { festival.currentTime = 0; } catch {}
    festival.volume = 0;
    festival.muted = false;
    if (festival.paused) playQuietly(festival);

    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken) return;
      const x = Math.min(1, (now - started) / CROSSFADE_MS);
      war.volume = startingWarVolume * Math.cos(x * Math.PI / 2);
      festival.volume = FESTIVAL_VOLUME * Math.sin(x * Math.PI / 2);

      if (x < 1) {
        requestAnimationFrame(tick);
      } else {
        war.volume = 0;
        war.pause();
      }
    };
    requestAnimationFrame(tick);
  }

  function syncToScene() {
    if (!armed) return;
    if (pressingActive()) {
      startFestivalTransition();
      return;
    }
    if (preludeActive()) startWar();
  }

  // Capture the user's Enter click before app.js handles it, guaranteeing that
  // the two real media elements are unlocked by the user gesture itself.
  document.addEventListener('click', event => {
    if (event.target.closest?.('.avarenne-entry-button')) {
      armRealAudio();
      requestAnimationFrame(syncToScene);
    }
  }, true);

  const preludeScene = document.getElementById('scene-prelude');
  const pressingScene = document.getElementById('scene-firstpressing');
  const observer = new MutationObserver(syncToScene);
  if (preludeScene) observer.observe(preludeScene, { attributes: true, attributeFilter: ['class'] });
  if (pressingScene) observer.observe(pressingScene, { attributes: true, attributeFilter: ['class'] });
})();