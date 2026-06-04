/* =========================================================
   ProFixer — Landing interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky nav shadow ---- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('#navLinks a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      // small stagger for siblings
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- Animated stat counters ---- */
  var counters = document.querySelectorAll('.stats [data-count]');
  var countObserved = false;
  function runCounters() {
    if (countObserved) return; countObserved = true;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var dur = 1200, start = performance.now();
      function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toString();
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  var statsSection = document.querySelector('.stats');
  if (statsSection && 'IntersectionObserver' in window) {
    var statIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounters(); statIo.disconnect(); } });
    }, { threshold: 0.4 });
    statIo.observe(statsSection);
  } else {
    runCounters();
  }

  /* ---- Pricing monthly/annual toggle ---- */
  var billToggle = document.getElementById('billToggle');
  var opts = document.querySelectorAll('.toggle__opt');
  function setBilling(annual) {
    if (billToggle) billToggle.classList.toggle('is-on', annual);
    opts.forEach(function (o) {
      o.classList.toggle('is-active', o.getAttribute('data-bill') === (annual ? 'annual' : 'monthly'));
    });
    document.querySelectorAll('.plan .amt[data-m]').forEach(function (el) {
      var raw = annual ? el.getAttribute('data-a') : el.getAttribute('data-m');
      var num = parseInt(raw, 10);
      el.textContent = isNaN(num) ? raw : num.toLocaleString('en-IN');
    });
  }
  if (billToggle) {
    billToggle.addEventListener('click', function () {
      setBilling(!billToggle.classList.contains('is-on'));
    });
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        setBilling(o.getAttribute('data-bill') === 'annual');
      });
    });
    setBilling(false);
  }

  /* ---- Lead form (front-end only demo) ---- */
  var form = document.getElementById('leadForm');
  var note = document.getElementById('formNote');
  if (form && note) {
    var defaultNote = note.textContent;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[name="email"]').value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      note.classList.remove('is-success', 'is-error');
      if (!valid) {
        note.textContent = 'Please enter a valid work email.';
        note.classList.add('is-error');
        return;
      }
      // TODO: POST to your /api/leads or marketing endpoint here.
      note.textContent = 'Thanks! We\u2019ll reach out to ' + email + ' shortly.';
      note.classList.add('is-success');
      form.reset();
      setTimeout(function () {
        note.textContent = defaultNote;
        note.classList.remove('is-success');
      }, 6000);
    });
  }

  /* ---- FAQ: close others when one opens (accordion) ---- */
  var faqItems = document.querySelectorAll('#faqList .faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) { if (other !== item) other.open = false; });
      }
    });
  });
})();
