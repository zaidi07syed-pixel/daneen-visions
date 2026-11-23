/* Daneen Visions: shared script for every page */
(function () {
  'use strict';

  /* ---------- settings you may edit ---------- */
  var WA_NUMBER = '917007996454';
  var CONTACT_EMAIL = 'Shifazaidi9@gmail.com';
  // Paste your deployed alert URL here (see visit-notify-worker.js). Leave empty to switch alerts off.
  var NOTIFY_ENDPOINT = '';
  // Add your real profile links. Any left empty stay hidden, so no button ever points nowhere.
  var SOCIALS = { instagram: '', behance: '', linkedin: '', youtube: '' };

  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- visit / enquiry alerts ---------- */
  function notify(type, extra) {
    if (!NOTIFY_ENDPOINT) return;
    try {
      var data = JSON.stringify({
        type: type,
        page: location.pathname || '/',
        referrer: document.referrer || 'direct',
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        time: new Date().toISOString(),
        extra: extra || ''
      });
      if (navigator.sendBeacon) navigator.sendBeacon(NOTIFY_ENDPOINT, new Blob([data], { type: 'text/plain' }));
      else fetch(NOTIFY_ENDPOINT, { method: 'POST', body: data, keepalive: true, mode: 'no-cors' });
    } catch (err) {}
  }
  try {
    if (!sessionStorage.getItem('dv_seen')) { sessionStorage.setItem('dv_seen', '1'); notify('visit'); }
  } catch (err) { notify('visit'); }

  /* ---------- header, menu, progress bar ---------- */
  var header = $('.site-header');
  var toggle = $('.menu-toggle');
  var links = $('#nav-links');
  var bar = $('#progress');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  toggle.addEventListener('click', function () {
    var open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }
  });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* images that finished loading before the handler ran */
  $$('.ph img, .statement-section > img').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) img.classList.add('ok');
  });

  /* ---------- scroll animations ---------- */
  var lastY = window.scrollY;
  var heroEl = $('[data-hero]');
  var heroIn = heroEl ? $('[data-hero-inner]', heroEl) : null;
  var blobs = heroEl ? $$('.hero-blob', heroEl) : [];
  var blobSpeed = [0.3, 0.15, -0.12];
  var pxImgs = $$('img.px');
  var stepsEl = $('.steps');
  var stepItems = stepsEl ? $$('.step', stepsEl) : [];
  var fxTick = false;
  function scrollFx() {
    fxTick = false;
    var y = window.scrollY, vh = window.innerHeight, dy = y - lastY;
    if (!header.classList.contains('menu-open') && !header.matches(':focus-within')) {
      if (dy > 6 && y > 240) header.classList.add('hide');
      else if (dy < -6 || y < 240) header.classList.remove('hide');
    }
    lastY = y;
    if (reduce) return;
    if (heroEl && heroIn && y < heroEl.offsetHeight) {
      var hp = Math.min(y / (heroEl.offsetHeight * 0.75), 1);
      heroIn.style.translate = '0 ' + (y * 0.16).toFixed(1) + 'px';
      heroIn.style.opacity = (1 - hp * 0.85).toFixed(3);
      blobs.forEach(function (b, i) { b.style.translate = '0 ' + (y * blobSpeed[i]).toFixed(1) + 'px'; });
    }
    pxImgs.forEach(function (img) {
      var box = img.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      var c = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2);
      img.style.translate = '0 ' + (-c * box.height * 0.1).toFixed(1) + 'px';
    });
    if (stepsEl) {
      var sr = stepsEl.getBoundingClientRect();
      stepsEl.style.setProperty('--p', Math.min(Math.max((vh * 0.65 - sr.top) / sr.height, 0), 1).toFixed(3));
      stepItems.forEach(function (st) {
        var r = st.getBoundingClientRect();
        st.classList.toggle('active', Math.abs(r.top + r.height / 2 - vh * 0.55) < r.height * 0.8);
      });
    }
  }
  window.addEventListener('scroll', function () { if (!fxTick) { fxTick = true; requestAnimationFrame(scrollFx); } }, { passive: true });
  window.addEventListener('resize', scrollFx);
  scrollFx();

  /* ---------- reveal on scroll + count-up ---------- */
  var revealEls = $$('[data-reveal]');
  function countUp(el) {
    var target = +el.getAttribute('data-count'), start = null, dur = 1600;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- rotating word (landing hero) ---------- */
  var rot = $('#rot');
  if (rot && !reduce) {
    var words = ['design', 'motion', 'video', 'stories', 'campaigns', 'content'];
    var wi = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        rot.textContent = words[wi];
        rot.classList.remove('out');
      }, 350);
    }, 2200);
  }

  /* ---------- mouse effects (desktop pointers only) ---------- */
  if (fine && !reduce) {
    if (heroEl) {
      heroEl.addEventListener('pointermove', function (e) {
        var r = heroEl.getBoundingClientRect();
        heroEl.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2);
        heroEl.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2);
      });
      heroEl.addEventListener('pointerleave', function () {
        heroEl.style.setProperty('--mx', 0);
        heroEl.style.setProperty('--my', 0);
      });
    }
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
    var glow = $('#glow');
    if (glow) {
      var gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
      window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; });
      (function follow() {
        gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
        glow.style.transform = 'translate(' + (gx - 240) + 'px,' + (gy - 240) + 'px)';
        requestAnimationFrame(follow);
      })();
    }
  }

  /* ---------- page transition (red wipe between pages) ---------- */
  var wipe = $('.wipe');
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || !wipe || reduce) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin || a.target === '_blank' || a.hasAttribute('download')) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    wipe.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 480);
  });
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted && wipe) wipe.classList.remove('leaving');
  });

  /* ---------- social links (only shown once you add a URL above) ---------- */
  var anySocial = false;
  $$('[data-social]').forEach(function (a) {
    var url = SOCIALS[a.getAttribute('data-social')];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; anySocial = true; }
  });
  $$('[data-social-wrap]').forEach(function (w) { w.hidden = !anySocial; });

  /* ---------- WhatsApp / email / call tracking ---------- */
  $$('a[href*="wa.me"]').forEach(function (a) {
    a.addEventListener('click', function () { notify('whatsapp click'); });
  });

  /* ---------- forms: enquiry (contact) and application (careers) ---------- */
  var SERVICES = {
    brand: 'Brand & graphic design', motion: 'Motion graphics & animation',
    video: 'Video editing & production', social: 'Social media content',
    ads: 'Ad creative production', photo: 'Photography & videography'
  };
  var ROLES = {
    graphic: 'Graphic designer', motion: 'Motion graphics artist', video: 'Video editor',
    social: 'Social media content creator', photo: 'Photographer / videographer', other: 'Something else'
  };
  function field(f, n) { return f.elements[n] ? f.elements[n].value : ''; }
  function buildMessage(f) {
    if (f.getAttribute('data-kind') === 'apply') {
      return "Hi Daneen Visions! I'd like to apply for the " + field(f, 'role') + ' role.\n\nName: ' + field(f, 'name') +
        '\nEmail: ' + field(f, 'email') + '\nPortfolio: ' + (field(f, 'portfolio') || 'not shared yet') + '\n\n' + field(f, 'message');
    }
    return "Hi Daneen Visions! I'd like to talk about a project.\n\nName: " + field(f, 'name') +
      '\nEmail: ' + field(f, 'email') + '\nService: ' + field(f, 'service') + '\n\n' + field(f, 'message');
  }
  function buildSubject(f) {
    return f.getAttribute('data-kind') === 'apply'
      ? 'Job application: ' + field(f, 'role')
      : 'New project enquiry: ' + field(f, 'service');
  }
  $$('form[data-kind]').forEach(function (f) {
    var kind = f.getAttribute('data-kind');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      notify(kind, 'email / ' + (field(f, 'service') || field(f, 'role')));
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(buildSubject(f)) + '&body=' + encodeURIComponent(buildMessage(f));
    });
    var wa = $('[data-wa]', f);
    if (wa) wa.addEventListener('click', function () {
      if (!f.reportValidity()) return;
      notify(kind, 'whatsapp / ' + (field(f, 'service') || field(f, 'role')));
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage(f)), '_blank', 'noopener');
    });
  });

  /* prefill from links such as contact.html?service=motion */
  var params = new URLSearchParams(location.search);
  function prefill(selectEl, map, key) {
    var v = map[params.get(key)];
    if (!selectEl || !v) return;
    for (var i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].text === v) { selectEl.selectedIndex = i; break; }
    }
  }
  var enq = $('#enquiry-form');
  if (enq) prefill(enq.elements['service'], SERVICES, 'service');
  var app = $('#apply-form');
  if (app) prefill(app.elements['role'], ROLES, 'role');

  /* careers: Apply buttons pick the role and jump to the form */
  $$('[data-apply]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!app) return;
      var v = ROLES[btn.getAttribute('data-apply')];
      for (var i = 0; i < app.elements['role'].options.length; i++) {
        if (app.elements['role'].options[i].text === v) { app.elements['role'].selectedIndex = i; break; }
      }
      app.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { app.elements['name'].focus({ preventScroll: true }); }, 500);
    });
  });
})();
