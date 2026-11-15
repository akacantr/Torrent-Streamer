(function () {
  'use strict';

  var BG_MARKUP =
    '<svg class="bg-base" xmlns="http://www.w3.org/2000/svg"><defs><g fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round">' +
    '<symbol id="g-sword" viewBox="0 0 16 16"><path d="M8 1.5l1.5 3v5h-3v-5zM4.5 9.5h7M8 9.5v3.5M6.5 14h3"/></symbol>' +
    '<symbol id="g-shield" viewBox="0 0 16 16"><path d="M8 1.7l5.2 1.8v4.1c0 3.1-2.2 5.4-5.2 6.7-3-1.3-5.2-3.6-5.2-6.7V3.5zM8 4.4v7.1"/></symbol>' +
    '<symbol id="g-pad" viewBox="0 0 16 16"><path d="M4 5.5h8a3 3 0 0 1 3 3v1.5a2 2 0 0 1-3.4 1.4l-1.1-.9h-5l-1.1.9A2 2 0 0 1 1 10V8.5a3 3 0 0 1 3-3zM4.5 7v3M3 8.5h3M10.5 7.5h.01M12 9h.01"/></symbol>' +
    '<symbol id="g-w" viewBox="0 0 16 16"><path d="M2.5 2.5h11v11h-11zM4.8 5.5l1.4 5L8 7l1.8 3.5 1.4-5"/></symbol>' +
    '<symbol id="g-a" viewBox="0 0 16 16"><path d="M2.5 2.5h11v11h-11zM5 10.8l3-5.6 3 5.6M6.1 9h3.8"/></symbol>' +
    '<symbol id="g-s" viewBox="0 0 16 16"><path d="M2.5 2.5h11v11h-11zM10.5 6c-.5-.6-1.3-.9-2.4-.9-1.3 0-2.1.6-2.1 1.5 0 1.9 4.9.9 4.9 3.1 0 1-.9 1.6-2.4 1.6-1.1 0-2-.4-2.6-1.1"/></symbol>' +
    '<symbol id="g-d" viewBox="0 0 16 16"><path d="M2.5 2.5h11v11h-11zM5.8 5.3v5.4h1.6c2 0 3.2-1 3.2-2.7s-1.2-2.7-3.2-2.7z"/></symbol>' +
    '<symbol id="g-heart" viewBox="0 0 16 16"><path d="M8 13.5C3 10 2 7.5 2 5.8A2.8 2.8 0 0 1 8 4.6a2.8 2.8 0 0 1 6 1.2c0 1.7-1 4.2-6 7.7z"/></symbol>' +
    '<symbol id="g-dice" viewBox="0 0 16 16"><path d="M3 3h10v10H3zM6 6h.01M10 6h.01M8 8h.01M6 10h.01M10 10h.01"/></symbol>' +
    '<symbol id="g-potion" viewBox="0 0 16 16"><path d="M6.5 1.5h3M7 1.5v4L3.5 12a1.5 1.5 0 0 0 1.3 2.3h6.4a1.5 1.5 0 0 0 1.3-2.3L9 5.5v-4M5 10h6"/></symbol>' +
    '<symbol id="g-aim" viewBox="0 0 16 16"><path d="M3.5 8a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3"/></symbol>' +
    '<symbol id="g-stick" viewBox="0 0 16 16"><path d="M8 2.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 6.5v4M4.5 10.5h7l1.5 3H3z"/></symbol>' +
    '</g><pattern id="gameIcons" width="256" height="192" patternUnits="userSpaceOnUse" fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round">' +
    '<use href="#g-w" x="18" y="18" width="28" height="28"/><use href="#g-sword" x="82" y="18" width="28" height="28" transform="rotate(15 96 32)"/>' +
    '<use href="#g-heart" x="146" y="18" width="28" height="28" transform="rotate(-10 160 32)"/><use href="#g-a" x="210" y="18" width="28" height="28"/>' +
    '<use href="#g-pad" x="18" y="82" width="28" height="28"/><use href="#g-s" x="82" y="82" width="28" height="28"/>' +
    '<use href="#g-aim" x="146" y="82" width="28" height="28"/><use href="#g-potion" x="210" y="82" width="28" height="28" transform="rotate(18 224 96)"/>' +
    '<use href="#g-d" x="18" y="146" width="28" height="28"/><use href="#g-shield" x="82" y="146" width="28" height="28" transform="rotate(-12 96 160)"/>' +
    '<use href="#g-stick" x="146" y="146" width="28" height="28" transform="rotate(8 160 160)"/><use href="#g-dice" x="210" y="146" width="28" height="28" transform="rotate(20 224 160)"/>' +
    '</pattern><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#8c8c8c"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#6e6e6e"/>' +
    '</linearGradient><pattern id="gameIconsMetal" width="256" height="192" patternUnits="userSpaceOnUse" fill="none" stroke="url(#metal)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
    '<use href="#g-w" x="18" y="18" width="28" height="28"/><use href="#g-sword" x="82" y="18" width="28" height="28" transform="rotate(15 96 32)"/>' +
    '<use href="#g-heart" x="146" y="18" width="28" height="28" transform="rotate(-10 160 32)"/><use href="#g-a" x="210" y="18" width="28" height="28"/>' +
    '<use href="#g-pad" x="18" y="82" width="28" height="28"/><use href="#g-s" x="82" y="82" width="28" height="28"/>' +
    '<use href="#g-aim" x="146" y="82" width="28" height="28"/><use href="#g-potion" x="210" y="82" width="28" height="28" transform="rotate(18 224 96)"/>' +
    '<use href="#g-d" x="18" y="146" width="28" height="28"/><use href="#g-shield" x="82" y="146" width="28" height="28" transform="rotate(-12 96 160)"/>' +
    '<use href="#g-stick" x="146" y="146" width="28" height="28" transform="rotate(8 160 160)"/><use href="#g-dice" x="210" y="146" width="28" height="28" transform="rotate(20 224 160)"/>' +
    '</pattern></defs><rect width="100%" height="100%" fill="url(#gameIcons)"/></svg>' +
    '<svg class="bg-glow" id="bgGlow" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="url(#gameIconsMetal)"/></svg>' +
    '<div class="bg-halo" id="bgHalo"></div>';

  function initAppTheme() {
    var body = document.body;
    if (!body) return;

    if (!document.querySelector('.bg')) {
      var bg = document.createElement('div');
      bg.className = 'bg';
      bg.setAttribute('aria-hidden', 'true');
      bg.innerHTML = BG_MARKUP;
      body.insertBefore(bg, body.firstChild);
    }

    if (window.__appThemeGlowBound) return;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var glow = document.getElementById('bgGlow');
    var halo = document.getElementById('bgHalo');
    if (!fine || !glow || !halo) return;

    window.__appThemeGlowBound = true;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement;
    var tx = 0;
    var ty = 0;
    var x = 0;
    var y = 0;
    var raf = 0;
    var on = false;

    var paint = function () {
      root.style.setProperty('--mx', x.toFixed(1) + 'px');
      root.style.setProperty('--my', y.toFixed(1) + 'px');
    };

    var step = function () {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      paint();
      raf = (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) ? requestAnimationFrame(step) : 0;
    };

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!on) {
        on = true;
        x = tx;
        y = ty;
        paint();
        glow.classList.add('on');
        halo.classList.add('on');
      }
      if (still) {
        x = tx;
        y = ty;
        paint();
      } else if (!raf) {
        raf = requestAnimationFrame(step);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      on = false;
      glow.classList.remove('on');
      halo.classList.remove('on');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppTheme, { once: true });
  } else {
    initAppTheme();
  }
})();
