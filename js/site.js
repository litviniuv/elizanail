(function () {
  'use strict';
  var root = document.documentElement;
  var body = document.body;
  var chrome = document.querySelector('.site-chrome');
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('site-menu');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isOpen = false;
  var savedY = 0;

  function chromeHeight() {
    return chrome ? Math.round(chrome.getBoundingClientRect().height) : 0;
  }
  function syncChrome() {
    root.style.setProperty('--chrome-h', chromeHeight() + 'px');
  }
  syncChrome();
  window.addEventListener('resize', syncChrome);
  if (chrome && 'ResizeObserver' in window) {
    new ResizeObserver(syncChrome).observe(chrome);
  }

  function jumpTo(y) {
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = prev;
  }

  function lockScroll() {
    savedY = window.scrollY || window.pageYOffset || 0;
    // Fixed-body lock only — no paddingTop (padding + sticky→fixed chrome was shifting unlock by hundreds of px).
    body.style.position = 'fixed';
    body.style.top = (-savedY) + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflowAnchor = 'none';
    root.classList.add('menu-open');
  }
  function unlockScroll() {
    var y = savedY;
    var top = body.style.top;
    if (top) {
      var parsed = parseInt(top, 10);
      if (!isNaN(parsed)) y = Math.max(0, -parsed);
    }
    // Chrome back to sticky (in flow) BEFORE clearing fixed + restoring scroll.
    root.classList.remove('menu-open');
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.paddingTop = '';
    body.style.overflowAnchor = '';
    jumpTo(y);
    // Layout may settle after sticky chrome reflows — pin again.
    requestAnimationFrame(function () {
      jumpTo(y);
    });
  }

  function menuFocusables() {
    return Array.prototype.slice.call(menu.querySelectorAll('a[href]'));
  }

  function openMenu() {
    if (!menu || isOpen) return;
    syncChrome();
    lockScroll();
    var h = chromeHeight();
    root.style.setProperty('--chrome-h', h + 'px');
    menu.style.top = h + 'px';
    menu.hidden = false;
    menu.scrollTop = 0;
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'Закрыть';
    isOpen = true;
  }

  function closeMenu(restoreFocus) {
    if (!menu || !isOpen) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Меню';
    isOpen = false;
    unlockScroll();
    if (restoreFocus) btn.focus({ preventScroll: true });
  }

  if (btn && menu) {
    btn.addEventListener('click', function () {
      if (isOpen) closeMenu(true); else openMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key === 'Tab') {
        var items = [btn].concat(menuFocusables());
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus({ preventScroll: true });
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus({ preventScroll: true });
        }
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }

  function targetTop(el) {
    return Math.max(0, Math.round(el.getBoundingClientRect().top + (window.scrollY || 0) - chromeHeight()));
  }

  function scrollToId(id, smooth) {
    if (!id) return false;
    var el = document.getElementById(id);
    if (!el) return false;
    var top = targetTop(el);
    if (smooth && !reduceMotion) {
      window.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      jumpTo(top);
    }
    return el;
  }

  function focusSection(el) {
    var heading = el.querySelector('h1, h2') || el;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    var el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (isOpen) closeMenu(false);
    requestAnimationFrame(function () {
      scrollToId(id, true);
      if (history.pushState) history.pushState(null, '', '#' + id);
      if (id !== 'top') focusSection(el);
    });
  });

  window.addEventListener('hashchange', function () {
    scrollToId(decodeURIComponent(location.hash.slice(1)), false);
  });

  function landOnHash() {
    if (location.hash.length > 1) scrollToId(decodeURIComponent(location.hash.slice(1)), false);
  }
  if (location.hash.length > 1) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('load', function () {
      syncChrome();
      landOnHash();
      setTimeout(landOnHash, 120);
    });
  }
})();
