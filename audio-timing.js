(() => {
  const NativeAudio = window.Audio;

  const WAR_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/crow/Avarenne_War_Cue_Crow_at_the_Gallows_Gate_128k-er8YtbMXUKkM0bQtXw9kudLSVyQ2uW.mp3';
  const FESTIVAL_SRC = 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/festival/Avarenne_Festival_Cue_Medieval_Celtic_Violin_128k-xJA8DzV0kYNCemDHm3gxlmytX2Ld7G.mp3';

  const WAR_VOLUME = 0.72;
  const FESTIVAL_VOLUME = 0.58;
  const WAR_FADE_MS = 1200;
  const CROSSFADE_MS = 1500;

  // app.js still contains its original audio code. Replace only those legacy
  // /api/audio objects with harmless dummies so there is exactly one system
  // controlling the real music.
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

  // Use real DOM media elements. They are started once by the explicit Enter
  // click and then remain playing silently until their scene cue. No later
  // play() call is required, so browser autoplay rules cannot block the handoff.
  const war = document.createElement('audio');
  const festival = document.createElement('audio');
  war.id = 'avarenne-war-audio';
  festival.id = 'avarenne-festival-audio';
  war.src = WAR_SRC;
  festival.src = FESTIVAL_SRC;
  war.preload = 'auto';
  festival.preload = 'auto';
  festival.loop = true;
  war.volume = 0;
  festival.volume = 0;
  war.muted = true;
  festival.muted = true;
  war.setAttribute('playsinline', '');
  festival.setAttribute('playsinline', '');
  war.style.display = 'none';
  festival.style.display = 'none';
  document.body.appendChild(war);
  document.body.appendChild(festival);

  let armed = false;
  let warStarted = false;
  let festivalStarted = false;
  let fadeToken = 0;

  const preludeActive = () => document.getElementById('scene-prelude')?.classList.contains('active');
  const pressingActive = () => document.getElementById('scene-firstpressing')?.classList.contains('active');

  function armRealAudio() {
    if (armed) return;
    armed = true;

    try { war.currentTime = 0; } catch {}
    try { festival.currentTime = 0; } catch {}
    war.volume = 0;
    festival.volume = 0;
    war.muted = true;
    festival.muted = true;

    const wp = war.play();
    if (wp?.catch) wp.catch(err => console.warn('War audio unlock failed.', err));
    const fp = festival.play();
    if (fp?.catch) fp.catch(err => console.warn('Festival audio unlock failed.', err));
  }

  function startWar() {
    if (!armed || warStarted || festivalStarted) return;
    warStarted = true;
    const token = ++fadeToken;

    try { war.currentTime = 0; } catch {}
    war.volume = 0;
    war.muted = false;

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

    // Festival has already been playing muted since Enter. Rewind it while it
    // is still running, then unmute at zero volume for the crossfade.
    try { festival.currentTime = 0; } catch {}
    festival.volume = 0;
    festival.muted = false;

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
        war.muted = true;
        war.pause();
      }
    };
    requestAnimationFrame(tick);
  }

  function syncToScene() {
    if (!armed) return;
    if (pressingActive()) {
      startFestivalTransition();
    } else if (preludeActive()) {
      startWar();
    }
  }

  // Capture the same user gesture used by the site's Enter button.
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.avarenne-entry-button')) return;
    armRealAudio();
    requestAnimationFrame(syncToScene);
  }, true);

  const observer = new MutationObserver(syncToScene);
  const preludeScene = document.getElementById('scene-prelude');
  const pressingScene = document.getElementById('scene-firstpressing');
  if (preludeScene) observer.observe(preludeScene, { attributes: true, attributeFilter: ['class'] });
  if (pressingScene) observer.observe(pressingScene, { attributes: true, attributeFilter: ['class'] });
})();