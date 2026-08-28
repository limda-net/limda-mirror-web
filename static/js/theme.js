/* Theme switcher for mirror.limda.net
 *
 * Three states, cycled by the navbar button:
 *   system (default) -> light -> dark -> system
 * The choice is stored in localStorage; with no stored choice the site
 * follows the operating system exactly as it did before.
 *
 * <picture> elements need special handling: a <source media="(prefers-color-
 * scheme: dark)"> is evaluated against the OS setting only, so it ignores an
 * explicit choice. When the visitor picks a theme we override each such
 * source's media attribute ("all" to force it on, "not all" to force it off)
 * and restore the original when they return to "system". That keeps the
 * no-JS path working untouched.
 */
(function () {
  var KEY = 'limda-theme';
  var ORDER = ['system', 'light', 'dark'];
  var root = document.documentElement;

  function stored() {
    try { var v = localStorage.getItem(KEY); return ORDER.indexOf(v) > -1 ? v : 'system'; }
    catch (e) { return 'system'; }
  }

  function effective(mode) {
    if (mode === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
    }
    return mode;
  }

  function syncPictures(mode) {
    var srcs = document.querySelectorAll('picture source[data-theme-media], picture source[media*="prefers-color-scheme"]');
    for (var i = 0; i < srcs.length; i++) {
      var s = srcs[i];
      if (!s.hasAttribute('data-theme-media')) s.setAttribute('data-theme-media', s.getAttribute('media') || '');
      if (mode === 'system') s.setAttribute('media', s.getAttribute('data-theme-media'));
      else s.setAttribute('media', effective(mode) === 'dark' ? 'all' : 'not all');
    }
  }

  function apply(mode) {
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    syncPictures(mode);
    var btns = document.querySelectorAll('.theme-toggle');
    var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-label', 'Theme: ' + mode + '. Switch to ' + next + '.');
      btns[i].setAttribute('title', 'Theme: ' + mode + ' — click for ' + next);
      var lab = btns[i].querySelector('.theme-label');
      if (lab) lab.textContent = mode;
    }
  }

  function set(mode) {
    try { mode === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, mode); }
    catch (e) {}
    apply(mode);
  }

  function init() {
    apply(stored());
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        set(ORDER[(ORDER.indexOf(stored()) + 1) % ORDER.length]);
      });
    }
    // follow the OS live while in system mode
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (stored() === 'system') apply('system'); };
      mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    }
    // keep tabs in sync
    window.addEventListener('storage', function (e) { if (e.key === KEY) apply(stored()); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init) : init();
})();
