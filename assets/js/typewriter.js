(function () {
  var el = document.getElementById("typewriter");
  if (!el || !window.RESEARCH_INTERESTS || !window.RESEARCH_INTERESTS.length) return;

  var texts = window.RESEARCH_INTERESTS;
  var idx = 0;
  var charIdx = 0;
  var isDeleting = false;
  var TYPE_SPEED = 60;
  var DELETE_SPEED = 40;
  var PAUSE_AFTER_TYPE = 1500;
  var PAUSE_AFTER_DELETE = 500;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = texts[0];
    return;
  }

  function tick() {
    var current = texts[idx];

    if (isDeleting) {
      charIdx -= 1;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        idx = (idx + 1) % texts.length;
        setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
      return;
    }

    charIdx += 1;
    el.textContent = current.slice(0, charIdx);
    if (charIdx === current.length) {
      isDeleting = true;
      setTimeout(tick, PAUSE_AFTER_TYPE);
      return;
    }
    setTimeout(tick, TYPE_SPEED);
  }

  tick();
})();
