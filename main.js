/* ============================================================
   SERINIFLEUR — main.js  v2
   Interactions · Animations · Pétales tombantes
   Vanilla JS — Zéro dépendance — Mobile First
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

/* ─────────────────────────────────────────────
   ANNÉE DYNAMIQUE (copyright)
───────────────────────────────────────────── */
const initYear = () => {
  $$('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
};

/* ─────────────────────────────────────────────
   HEADER — effet au scroll
───────────────────────────────────────────── */
const initHeaderScroll = () => {
  const header = $('header');
  if (!header) return;

  const update = () =>
    header.classList.toggle('scrolled', window.scrollY > 40);

  window.addEventListener('scroll', update, { passive: true });
  update();
};

/* ─────────────────────────────────────────────
   MENU HAMBURGER MOBILE
───────────────────────────────────────────── */
const initMobileMenu = () => {
  const btn   = $('.hamburger');
  const menu  = $('.mobile-menu');
  const close = $('.mobile-menu-close');
  if (!btn || !menu) return;

  const open = () => {
    menu.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  };

  const shut = () => {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click',   () => menu.classList.contains('open') ? shut() : open());
  if (close) close.addEventListener('click', shut);

  // Ferme sur clic d'un lien
  $$('.mobile-menu ul a').forEach(a => a.addEventListener('click', shut));

  // Ferme avec Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      shut();
      btn.focus();
    }
  });
};

/* ─────────────────────────────────────────────
   RETOUR EN HAUT — apparition au scroll
───────────────────────────────────────────── */
const initBackToTop = () => {
  const wrap = $('.backtop');
  if (!wrap) return;

  const update = () =>
    wrap.classList.toggle('visible', window.scrollY > 320);

  window.addEventListener('scroll', update, { passive: true });
  update();
};

/* ─────────────────────────────────────────────
   CARTE CONTACT DÉPLIABLE (hero)
───────────────────────────────────────────── */
const initContactCard = () => {
  const btn  = $('#btn-contact');
  const card = $('#hero-contact-card');
  if (!btn || !card) return;

  btn.addEventListener('click', () => {
    const opening = !card.classList.contains('open');
    card.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(opening));
  });
};

/* ─────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
───────────────────────────────────────────── */
const initScrollReveal = () => {
  const targets = $$('main article');
  if (!targets.length) return;

  // Fallback si pas de support
  if (!('IntersectionObserver' in globalThis)) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }

  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
  );

  targets.forEach(el => obs.observe(el));
};

/* ─────────────────────────────────────────────
   SMOOTH SCROLL ancres internes
───────────────────────────────────────────── */
const initSmoothScroll = () => {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id     = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      const offset = ($('header')?.offsetHeight ?? 0) + 16;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
    });
  });
};

/* ─────────────────────────────────────────────
   PÉTALES — Canvas animé
───────────────────────────────────────────── */
const initPetals = () => {
  /* Respect préférence système */
  if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Création du canvas */
  const canvas = document.createElement('canvas');
  canvas.id = 'petals-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  /* Dimensions */
  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Classe Pétale ── */
  class Petal {
    constructor(initial = false) { this.init(initial); }

    init(initial = false) {
      const W = canvas.width;
      const H = canvas.height;

      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : -20;

      /* Taille */
      this.w = 5  + Math.random() * 5;   // demi-largeur 5–10px
      this.h = 8  + Math.random() * 7;   // demi-hauteur 8–15px

      /* Couleur : rose très doux, légèrement varié */
      const r   = 235 + Math.floor(Math.random() * 18);
      const g   = 155 + Math.floor(Math.random() * 60);
      const b   = 145 + Math.floor(Math.random() * 55);
      const al  = 0.4  + Math.random() * 0.45;
      this.fill = `rgba(${r},${g},${b},${al})`;

      /* Physique */
      this.vy          = 0.55 + Math.random() * 1.1;  // vitesse chute
      this.driftAmp    = 0.5  + Math.random() * 0.7;  // amplitude oscillation horiz.
      this.driftFreq   = 0.008 + Math.random() * 0.01;
      this.driftPhase  = Math.random() * Math.PI * 2;

      /* Rotation */
      this.angle     = Math.random() * Math.PI * 2;
      this.rotSpeed  = (Math.random() - 0.5) * 0.025;

      /* Balancement du ratio W/H (pétale qui se retourne) */
      this.flipAngle = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.012 + Math.random() * 0.015;
    }

    update() {
      this.y         += this.vy;
      this.driftPhase += this.driftFreq;
      this.x         += Math.sin(this.driftPhase) * this.driftAmp;
      this.angle     += this.rotSpeed;
      this.flipAngle += this.flipSpeed;

      /* Recyclage */
      if (this.y > canvas.height + 24 ||
          this.x < -40 ||
          this.x > canvas.width + 40) {
        this.init();
      }
    }

    draw() {
      /* Ratio qui simule le retournement du pétale */
      const scaleY = Math.abs(Math.cos(this.flipAngle)) * 0.6 + 0.4;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, scaleY);

      /* Forme pétale : deux courbes de Bézier */
      ctx.beginPath();
      ctx.moveTo(0, -this.h);
      ctx.bezierCurveTo(
         this.w * 1.1,  -this.h * 0.4,
         this.w * 0.9,   this.h * 0.5,
         0,              this.h
      );
      ctx.bezierCurveTo(
        -this.w * 0.9,   this.h * 0.5,
        -this.w * 1.1,  -this.h * 0.4,
         0,             -this.h
      );
      ctx.closePath();

      /* Remplissage */
      ctx.fillStyle = this.fill;
      ctx.fill();

      /* Nervure centrale très subtile */
      ctx.beginPath();
      ctx.moveTo(0, -this.h * 0.8);
      ctx.lineTo(0,  this.h * 0.8);
      ctx.strokeStyle = `rgba(255,255,255,0.22)`;
      ctx.lineWidth   = 0.6;
      ctx.stroke();

      ctx.restore();
    }
  }

  /* Nombre de pétales selon largeur */
  const count = () => {
    const w = canvas.width;
    if (w < 480)  return 16;
    if (w < 768)  return 26;
    if (w < 1280) return 38;
    return 52;
  };

  let petals = Array.from({ length: count() }, () => new Petal(true));

  window.addEventListener('resize', () => {
    const n = count();
    while (petals.length < n) petals.push(new Petal());
    if (petals.length > n) petals.length = n;
  }, { passive: true });

  /* ── Boucle ── */
  let raf = null;

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  };

  /* Pause onglet en arrière-plan */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      loop();
    }
  });

  loop();
};

/* ─────────────────────────────────────────────
   INIT GLOBALE
───────────────────────────────────────────── */
const init = () => {
  initYear();
  initHeaderScroll();
  initMobileMenu();
  initBackToTop();
  initContactCard();
  initScrollReveal();
  initSmoothScroll();

  /* Pétales après le premier paint */
  requestAnimationFrame(() => setTimeout(initPetals, 400));
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();