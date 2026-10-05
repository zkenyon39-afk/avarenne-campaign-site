(() => {
  const canvas = document.getElementById('background');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const startedAt = performance.now();

  function revealWhenPainted() {
    if (canvas.classList.contains('atmosphere-ready')) return;

    if (canvas.width > 0 && canvas.height > 0) {
      try {
        const x = Math.floor(canvas.width * 0.5);
        const y = Math.floor(canvas.height * 0.85);
        const alpha = ctx.getImageData(x, y, 1, 1).data[3];

        if (alpha > 0) {
          /* One extra frame guarantees the browser has committed opacity:0
             before we transition to the visible state. */
          requestAnimationFrame(() => {
            requestAnimationFrame(() => canvas.classList.add('atmosphere-ready'));
          });
          return;
        }
      } catch (_) {}
    }

    /* Safety valve: never leave the atmosphere permanently hidden if a browser
       blocks pixel inspection for an unexpected reason. */
    if (performance.now() - startedAt > 12000) {
      canvas.classList.add('atmosphere-ready');
      return;
    }

    requestAnimationFrame(revealWhenPainted);
  }

  requestAnimationFrame(revealWhenPainted);
})();
