(function () {
  'use strict';
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;
  var root = document.documentElement;
  window.addEventListener('pointermove', function (e) {
    root.style.setProperty('--gx', e.clientX + 'px');
    root.style.setProperty('--gy', e.clientY + 'px');
  }, { passive: true });

  var hero = document.querySelector('.b-hero');
  var tilt = document.querySelector('.b-photo-tilt');
  if (!hero || !tilt) return;
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    tilt.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
  });
  hero.addEventListener('pointerleave', function () {
    tilt.style.setProperty('--rx', '0deg');
    tilt.style.setProperty('--ry', '0deg');
    tilt.style.setProperty('--rz', '0deg');
  });
  tilt.addEventListener('pointerdown', function () { tilt.style.setProperty('--rz', '-6deg'); });
  window.addEventListener('pointerup', function () { tilt.style.setProperty('--rz', '0deg'); });
})();
