(() => {
  const NativeAudio = window.Audio;
  const managed = {};
  let audioUnlocked = false;

  const SOURCES = {
    crow: 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/crow/Avarenne_War_Cue_Crow_at_the_Gallows_Gate_128k-er8YtbMXUKkM0bQtXw9kudLSVyQ2uW.mp3',
    festival: 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/festival/Avarenne_Festival_Cue_Medieval_Celtic_Violin_128k-xJA8DzV0kYNCemDHm3gxlmytX2Ld7G.mp3'
  };

  function keyFromSrc(src='') {
    if (String(src).includes('track=crow')) return 'crow';
    if (String(src).includes('track=festival')) return 'festival';
    return null;
  }

  function ManagedAudio(src) {
    const key = keyFromSrc(src);
    if (!key) return new NativeAudio(src);

    // Use the campaign Blob URLs directly so playback does not wait on an API redirect.
    const real = new NativeAudio(SOURCES[key]);
    real.preload = 'auto';
    real.volume = 0;

    const wrapper = {
      _real: real,
      _volume: 0,
      play() {
        // This is called inside the Enter Avarenne click. Keep both files silently
        // playing so later cue changes do not require a second autoplay permission.
        audioUnlocked = true;
        real.volume = 0;
        const p = real.play();
        return p;
      },
      pause() {
        // The reveal-synced controller below owns the actual stop timing.
      },
      get currentTime() { return real.currentTime; },
      set currentTime(v) { try { real.currentTime = v; } catch {} },
      get volume() { return this._volume; },
      set volume(v) { this._volume = Number(v) || 0; },
      get preload() { return real.preload; },
      set preload(v) { real.preload = v; },
      get loop() { return real.loop; },
      set loop(v) { real.loop = !!v; },
      get paused() { return real.paused; },
      get ended() { return real.ended; },
      get readyState() { return real.readyState; },
      load() { return real.load(); }
    };

    managed[key] = wrapper;
    return wrapper;
  }

  window.Audio = ManagedAudio;
  window.__avarenneManagedAudio = managed;

  const WAR_VOLUME = 0.72;
  const FESTIVAL_VOLUME = 0.58;
  const WAR_FADE_MS = 650;
  const CROSSFADE_MS = 1500;
  let fadeToken = 0;
  let warStarted = false;
  let festivalStarted = false;

  function ensurePlaying(real) {
    if (!real || !real.paused) return;
    const p = real.play();
    if (p?.catch) p.catch(() => {});
  }

  function startWarWithTitle() {
    if (!audioUnlocked || warStarted || !managed.crow) return;
    warStarted = true;
    const real = managed.crow._real;
    const token = ++fadeToken;

    // The file has already been primed silently by the Enter click. Rewind it
    // exactly when the War Looms scene becomes active so the cue starts at 0:00.
    try { real.currentTime = 0; } catch {}
    real.volume = 0;
    ensurePlaying(real);

    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken || festivalStarted) return;
      const x = Math.min(1, (now - started) / WAR_FADE_MS);
      real.volume = WAR_VOLUME * x;
      if (x < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function crossfadeToFestival() {
    if (!audioUnlocked || festivalStarted || !managed.festival) return;
    festivalStarted = true;

    const war = managed.crow?._real;
    const festival = managed.festival._real;
    const token = ++fadeToken;

    // Always restart the festival cue from its literal beginning.
    try { festival.currentTime = 0; } catch {}
    festival.volume = 0;
    ensurePlaying(festival);

    const startingWarVolume = war ? Math.max(0, Math.min(WAR_VOLUME, war.volume || WAR_VOLUME)) : 0;
    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken) return;
      const x = Math.min(1, (now - started) / CROSSFADE_MS);
      if (war) war.volume = startingWarVolume * Math.cos(x * Math.PI / 2);
      festival.volume = FESTIVAL_VOLUME * Math.sin(x * Math.PI / 2);
      if (x < 1) {
        requestAnimationFrame(tick);
      } else if (war) {
        war.volume = 0;
        war.pause();
      }
    };
    requestAnimationFrame(tick);
  }

  function inspectPreludeLine(line) {
    if (!line?.classList?.contains('visible')) return;
    const holder = line.parentElement;
    if (!holder || holder.id !== 'preludeLines') return;
    const lines = [...holder.querySelectorAll('.teaser-line')];
    if (lines.indexOf(line) === lines.length - 1) crossfadeToFestival();
  }

  // Start Crow when the War Looms page itself appears, not when the body copy arrives.
  const preludeScene = document.getElementById('scene-prelude');
  if (preludeScene) {
    const sceneObserver = new MutationObserver(() => {
      if (preludeScene.classList.contains('active')) startWarWithTitle();
    });
    sceneObserver.observe(preludeScene, { attributes: true, attributeFilter: ['class'] });
  }

  // Start the tighter handoff when the final "But in the lands to the south..." paragraph fades in.
  const holder = document.getElementById('preludeLines');
  if (holder) {
    const lineObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') inspectPreludeLine(mutation.target);
      }
    });
    lineObserver.observe(holder, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();