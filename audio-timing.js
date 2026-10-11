(() => {
  const NativeAudio = window.Audio;
  const managed = {};
  let audioUnlocked = false;
  let festivalPrimed = false;

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

        if (key === 'festival' && !pressingActive()) {
          // Prime this media element exactly once during the user's Enter click,
          // then stop and rewind it. Subsequent obsolete app play() calls before
          // First Pressing are ignored completely.
          if (!festivalPrimed) {
            festivalPrimed = true;
            real.volume = 0;
            const p = real.play();
            if (p?.then) {
              p.then(() => {
                real.pause();
                try { real.currentTime = 0; } catch {}
                real.volume = 0;
              }).catch(() => {});
            } else {
              real.pause();
              try { real.currentTime = 0; } catch {}
            }
            return p;
          }
          return Promise.resolve();
        }

        return real.play();
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
            // Allow the main app's War Looms fade-in, but ignore the obsolete
            // last-paragraph fade-out. Crow stays audible for the whole scene.
            real.volume = Math.max(real.volume, value);
          } else if (!preludeActive() && !pressingActive()) {
            real.volume = value;
          }
          return;
        }

        if (key === 'festival') {
          // No festival audio is allowed before First Pressing. Once that scene
          // is active, crossfadeToFestival owns the real element directly.
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
    if (!audioUnlocked || festivalStarted || !managed.festival || !pressingActive()) return;
    festivalStarted = true;

    const war = managed.crow?._real;
    const festival = managed.festival._real;
    const token = ++fadeToken;

    // Always begin the festival track at the literal beginning.
    festival.pause();
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

  const pressingScene = document.getElementById('scene-firstpressing');
  if (pressingScene) {
    const pressingObserver = new MutationObserver(() => {
      if (pressingScene.classList.contains('active')) crossfadeToFestival();
    });
    pressingObserver.observe(pressingScene, { attributes: true, attributeFilter: ['class'] });
  }

  function watchForFirstPressing() {
    if (!festivalStarted && pressingActive()) crossfadeToFestival();
    if (!festivalStarted) requestAnimationFrame(watchForFirstPressing);
  }
  requestAnimationFrame(watchForFirstPressing);
})();