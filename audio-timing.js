(() => {
  const NativeAudio = window.Audio;
  const managed = {};
  let audioUnlocked = false;

  const SOURCES = {
    crow: 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/crow/Avarenne_War_Cue_Crow_at_the_Gallows_Gate_128k-er8YtbMXUKkM0bQtXw9kudLSVyQ2uW.mp3',
    festival: 'https://f7lymzdc6juzspur.public.blob.vercel-storage.com/campaign/audio/festival/Avarenne_Festival_Cue_Medieval_Celtic_Violin_128k-xJA8DzV0kYNCemDHm3gxlmytX2Ld7G.mp3'
  };

  const preludeActive = () => document.getElementById('scene-prelude')?.classList.contains('active');
  const pressingActive = () => document.getElementById('scene-firstpressing')?.classList.contains('active');

  function keyFromSrc(src='') {
    if (String(src).includes('track=crow')) return 'crow';
    if (String(src).includes('track=festival')) return 'festival';
    return null;
  }

  function ManagedAudio(src) {
    const key = keyFromSrc(src);
    if (!key) return new NativeAudio(src);

    const real = new NativeAudio(SOURCES[key]);
    real.preload = 'auto';
    real.volume = 0;

    const wrapper = {
      _real: real,
      _volume: 0,
      play() {
        audioUnlocked = true;
        const p = real.play();
        return p;
      },
      pause() {
        // The old app transition fires on the last War Looms paragraph. Keep
        // Crow alive until First Pressing actually appears.
        if (key === 'crow' && !pressingActive()) return;
        real.pause();
      },
      get currentTime() { return real.currentTime; },
      set currentTime(v) { try { real.currentTime = v; } catch {} },
      get volume() { return this._volume; },
      set volume(v) {
        const value = Math.max(0, Math.min(1, Number(v) || 0));
        this._volume = value;

        if (key === 'crow') {
          if (preludeActive() && !pressingActive()) {
            // Allow the main app's War Looms fade-in, but ignore the old
            // last-paragraph fade-out. This keeps Crow audible for the whole page.
            real.volume = Math.max(real.volume, value);
          } else if (!preludeActive() && !pressingActive()) {
            real.volume = value;
          }
          return;
        }

        if (key === 'festival') {
          // Ignore the main app's obsolete last-paragraph festival fade.
          // The real festival cue is handled below when First Pressing appears.
          real.volume = pressingActive() ? value : 0;
        }
      },
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
  const CROSSFADE_MS = 1500;
  let festivalStarted = false;
  let fadeToken = 0;

  function ensurePlaying(real) {
    if (!real || !real.paused) return;
    const p = real.play();
    if (p?.catch) p.catch(() => {});
  }

  function crossfadeToFestival() {
    if (!audioUnlocked || festivalStarted || !managed.festival) return;
    festivalStarted = true;

    const war = managed.crow?._real;
    const festival = managed.festival._real;
    const token = ++fadeToken;

    // Festival must always begin at the literal start of the uploaded track.
    try { festival.currentTime = 0; } catch {}
    festival.volume = 0;
    ensurePlaying(festival);

    const startingWarVolume = war ? war.volume : 0;
    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken) return;
      const x = Math.min(1, (now - started) / CROSSFADE_MS);
      if (war) war.volume = startingWarVolume * Math.cos(x * Math.PI / 2);
      festival.volume = FESTIVAL_VOLUME * Math.sin(x * Math.PI / 2);
      if (x < 1) requestAnimationFrame(tick);
      else if (war) { war.volume = 0; war.pause(); }
    };
    requestAnimationFrame(tick);
  }

  // The main app now owns Crow's start: it already calls startWarMusic()
  // immediately after War Looms becomes active. We only own the scene-level
  // handoff into the festival cue.
  const pressingScene = document.getElementById('scene-firstpressing');
  if (pressingScene) {
    const pressingObserver = new MutationObserver(() => {
      if (pressingScene.classList.contains('active')) crossfadeToFestival();
    });
    pressingObserver.observe(pressingScene, { attributes: true, attributeFilter: ['class'] });
  }
})();