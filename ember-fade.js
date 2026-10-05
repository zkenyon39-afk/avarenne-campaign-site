(() => {
  const body = document.body;
  const title = document.getElementById('scene-title');
  const prelude = document.getElementById('scene-prelude');
  const pressing = document.getElementById('scene-firstpressing');
  const pressingLines = document.getElementById('pressingLines');
  const countdownBox = document.querySelector('#scene-firstpressing .countdown-box');
  if (!body || !title || !prelude || !pressing) return;

  let emberTimer = null;
  let countdownTimer = null;

  function syncEmbers(){
    if (emberTimer) clearTimeout(emberTimer);
    emberTimer = null;

    if (pressing.classList.contains('active')) {
      body.classList.add('embers-visible');
      return;
    }

    if (prelude.classList.contains('active')) {
      body.classList.remove('embers-visible');
      emberTimer = setTimeout(() => {
        if (prelude.classList.contains('active')) {
          body.classList.add('embers-visible');
        }
      }, 800);
      return;
    }

    body.classList.remove('embers-visible');
  }

  function resetCountdown(){
    if (countdownTimer) clearTimeout(countdownTimer);
    countdownTimer = null;
    if (countdownBox) countdownBox.classList.remove('countdown-visible');
  }

  function scheduleCountdownIfReady(){
    if (!countdownBox || !pressingLines || !pressing.classList.contains('active')) return;
    const lines = [...pressingLines.querySelectorAll('.teaser-line')];
    if (!lines.length){
      resetCountdown();
      countdownTimer = setTimeout(() => {
        if (pressing.classList.contains('active')) countdownBox.classList.add('countdown-visible');
      }, 3500);
      return;
    }

    const last = lines[lines.length - 1];
    if (!last.classList.contains('visible')) return;

    if (countdownTimer) clearTimeout(countdownTimer);
    /* The line receives .visible before its 2.25s CSS transition delay begins.
       5.25s lets that delay + 1.4s fade finish, then leaves about 1.6s of quiet
       before the countdown becomes the final reveal. */
    countdownTimer = setTimeout(() => {
      if (pressing.classList.contains('active') && last.classList.contains('visible')) {
        countdownBox.classList.add('countdown-visible');
      }
    }, 5250);
  }

  const sceneObserver = new MutationObserver(() => {
    syncEmbers();
    if (!pressing.classList.contains('active')) resetCountdown();
    else {
      resetCountdown();
      scheduleCountdownIfReady();
    }
  });
  [title, prelude, pressing].forEach(el => sceneObserver.observe(el, {attributes:true, attributeFilter:['class']}));

  if (pressingLines) {
    const lineObserver = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'childList')) resetCountdown();
      scheduleCountdownIfReady();
    });
    lineObserver.observe(pressingLines, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  }

  syncEmbers();
  resetCountdown();
  scheduleCountdownIfReady();
})();
