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
          // Unlock the festival element during the user's Enter gesture, but keep
          // it hard-muted and running in the background. Do NOT pause it: some
          // browsers will block a later restart without another user gesture.
          if (!festivalPrimed) {
            festivalPrimed = true;
            try { real.currentTime = 0; } catch {}
            real.volume = 0;
            real.muted = true;
            const p = real.play();
            if (p?.catch) p.catch(() => {});
            return p;
          }
          return Promise.resolve();
        }

        return real.play();
      },
      pause() {
        // Ignore the obsolete last-paragraph Crow shutdown. Crow should remain
        // alive until the First Pressing handoff actually completes.
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
            // Allow the main app's War Looms fade-in, but reject its obsolete
            // last-paragraph fade-out by never lowering the real volume here.
            real.volume = Math.max(real.volume, value);
          } else if (!preludeActive() && !pressingActive()) {
            real.volume = value;
          }
          return;
        }

        if (key === 'festival') {
          // Before First Pressing the real track may be running, but it must be
          // completely inaudible regardless of what the old app tries to do.
          if (!pressingActive()) {
            real.volume = 0;
            real.muted = true;
            return;
          }
          real.volume = value;
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

  function crossfadeToFestival() {
    if (!audioUnlocked || festivalStarted || !managed.festival || !pressingActive()) return;
    festivalStarted = true;

    const war = managed.crow?._real;
    const festival = managed.festival._real;
    const token = ++fadeToken;

    // The festival element should already be playing silently from the Enter
    // gesture. Rewind it while it is live, then unmute and bring it in.
    try { festival.currentTime = 0; } catch {}
    festival.volume = 0;
    festival.muted = false;

    // Defensive fallback for browsers that suspended the silent element anyway.
    if (festival.paused) {
      const p = festival.play();
      if (p?.catch) p.catch(() => {});
    }

    const startingWarVolume = war ? war.volume : 0;
    const started = performance.now();
    const tick = now => {
      if (token !== fadeToken) return;
      const x = Math.min(1, (now - started) / CROSSFADE_MS);
      if (war) war.volume = startingWarVolume * Math.cos(x * Math.PI / 2);
      festival.volume = FESTIVAL_VOLUME * Math.sin(x * Math.PI / 2);
      if (x < 1) {
        requestAnimationFrame(tick);
      } else {
        if (war) {
          war.volume = 0;
          war.pause();
        }
        festival.volume = FESTIVAL_VOLUME;
      }
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

  // Fail-safe in case the class change and observer callback land in an awkward
  // ordering. Still scene-driven, not timestamp-driven.
  function watchForFirstPressing() {
    if (!festivalStarted && pressingActive()) crossfadeToFestival();
    if (!festivalStarted) requestAnimationFrame(watchForFirstPressing);
  }
  requestAnimationFrame(watchForFirstPressing);
})();