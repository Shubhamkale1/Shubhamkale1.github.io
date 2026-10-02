// =====================================================================
// Everything runs after the page is ready. Each block below is one feature.
// =====================================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------
// 1. NAVBAR: show after hero, highlight the current section, mobile menu
// ---------------------------------------------------------------
const nav = document.getElementById('siteNav');
const hero = document.getElementById('home');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-links a');

function updateNavVisibility() {
  // Show the bar once the visitor has scrolled past 60% of the hero
  nav.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.6);
}

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.textContent = open ? 'Close' : 'Menu';
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.textContent = 'Menu';
  });
});

// Scroll-spy: which section is in the middle of the screen right now?
const spyTargets = [...navLinks]
  .map((a) => document.getElementById(a.dataset.spy))
  .filter(Boolean);

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.dataset.spy === entry.target.id));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' } // a thin band in the middle of the viewport
);
spyTargets.forEach((s) => spyObserver.observe(s));

// ---------------------------------------------------------------
// 2. SCROLL PROGRESS BARS (top + right edge)
// ---------------------------------------------------------------
const progressTop = document.getElementById('progressTop');
const progressSide = document.getElementById('progressSide');

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
  progressTop.style.width = pct + '%';
  progressSide.style.height = pct + '%';
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateNavVisibility();
    updateProgress();
    ticking = false;
  });
}, { passive: true });
updateNavVisibility();
updateProgress();

// ---------------------------------------------------------------
// 3. REVEAL ON SCROLL (fade + rise) for every .reveal element
// ---------------------------------------------------------------
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target); // animate only once
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in')); // no animation: just show everything
}

// ---------------------------------------------------------------
// 4. PROJECT IMAGE SLIDERS (arrows, dots, auto-play)
// ---------------------------------------------------------------
document.querySelectorAll('[data-slider]').forEach((slider) => {
  const track = slider.querySelector('.slides');
  const slides = slider.querySelectorAll('.slides img');
  const dotsBox = slider.querySelector('.s-dots');
  let index = 0;
  let timer = null;

  // one dot per slide
  const dots = [...slides].map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show image ' + (i + 1));
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(b);
    return b;
  });

  function go(i) {
    index = (i + slides.length) % slides.length; // wrap around
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    dots.forEach((d, n) => d.classList.toggle('on', n === index));
  }

  function restart() {
    if (prefersReducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5000);
  }

  slider.querySelector('.s-prev').addEventListener('click', () => { go(index - 1); restart(); });
  slider.querySelector('.s-next').addEventListener('click', () => { go(index + 1); restart(); });
  slider.addEventListener('mouseenter', () => clearInterval(timer)); // pause while hovering
  slider.addEventListener('mouseleave', restart);

  go(0);
  restart();
});

// ---------------------------------------------------------------
// 5. "OTHER PROJECTS" CAROUSEL ARROWS
// ---------------------------------------------------------------
document.querySelectorAll('[data-carousel]').forEach((car) => {
  const track = car.querySelector('.c-track');
  car.querySelector('.c-prev').addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
  car.querySelector('.c-next').addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
});

// ---------------------------------------------------------------
// 6. CODING PROFILE: if a stats image fails to load, show a text link instead
// ---------------------------------------------------------------
document.querySelectorAll('.stat-img').forEach((img) => {
  const wrap = img.closest('.stat-img-wrap');
  const fail = () => wrap.classList.add('failed');
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0) fail();
});

// ---------------------------------------------------------------
// 7. CONTACT FORM
// Works with NO backend: it opens the visitor's email app with the message filled in.
// Want messages delivered straight to your inbox instead?
//   1) Create a free form at formspree.io
//   2) Paste its URL below, for example: 'https://formspree.io/f/abcdwxyz'
// ---------------------------------------------------------------
const FORM_ENDPOINT = '';
const MY_EMAIL = 'shubhamkale.sits.comp@gmail.com';

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = 'form-status' + (type ? ' ' + type : '');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const message = form.elements.message.value.trim();

  if (!name || !email || !message) { setStatus('Please fill in all three fields.', 'err'); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { setStatus('Please enter a valid email address.', 'err'); return; }

  if (FORM_ENDPOINT) {
    try {
      setStatus('Sending...', '');
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      setStatus('Thanks! Your message was sent.', 'ok');
    } catch (err) {
      setStatus('Something went wrong. Please email me directly.', 'err');
    }
    return;
  }

  // Fallback: open the email app
  const subject = encodeURIComponent('Portfolio message from ' + name);
  const body = encodeURIComponent(message + '\n\nFrom: ' + name + ' (' + email + ')');
  window.location.href = 'mailto:' + MY_EMAIL + '?subject=' + subject + '&body=' + body;
  setStatus('Opening your email app...', 'ok');
});

// ---------------------------------------------------------------
// 8. FOOTER YEAR
// ---------------------------------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------------------------------------------------------------
// 9. EDUCATION: the timeline line grows as you scroll
//    We measure how far the timeline is inside the screen (0 to 1)
//    and hand that number to CSS as the variable --line.
// ---------------------------------------------------------------
const zigzag = document.querySelector('.zigzag');

function updateTimeline() {
  if (!zigzag) return;
  if (prefersReducedMotion) { zigzag.style.setProperty('--line', 1); return; }
  const rect = zigzag.getBoundingClientRect();
  const progress = (window.innerHeight * 0.75 - rect.top) / rect.height;
  zigzag.style.setProperty('--line', Math.min(1, Math.max(0, progress)).toFixed(3));
}
window.addEventListener('scroll', updateTimeline, { passive: true });
window.addEventListener('resize', updateTimeline);
updateTimeline();

// ---------------------------------------------------------------
// 10. CODING PROFILE: numbers count up when they scroll into view
// ---------------------------------------------------------------
function animateCount(el) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion) { el.textContent = target + suffix; return; }

  const duration = 1600;            // milliseconds
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);   // 0 to 1
    const eased = 1 - Math.pow(1 - t, 3);              // starts fast, slows down at the end
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    animateCount(entry.target);
    obs.unobserve(entry.target);    // count only once
  });
}, { threshold: 0.6 });
document.querySelectorAll('.count').forEach((el) => {
  // People who turned animations off just see the final number right away
  if (prefersReducedMotion) animateCount(el);
  else countObserver.observe(el);
});

// ---------------------------------------------------------------
// 11. 3D TILT on cards that follow the mouse (only on devices with a real mouse)
// ---------------------------------------------------------------
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;    // 0 (left edge) to 1 (right edge)
      const y = (e.clientY - r.top) / r.height;    // 0 (top edge) to 1 (bottom edge)
      card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// ---------------------------------------------------------------
// 12. PROJECTS: spotlight glow that follows the cursor on each card
// ---------------------------------------------------------------
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.pin-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}

// ---------------------------------------------------------------
// 13. EXPERIENCE: drifting particle-network background (plain canvas, no library)
//     Dots float slowly; any two dots close enough get a faint line between them.
// ---------------------------------------------------------------
function startParticleNetwork(canvas) {
  const ctx = canvas.getContext('2d');
  const section = canvas.closest('section');

  let dots = [];
  let w = 0, h = 0;
  const LINK_DIST = 170;       // dots closer than this (in px) get a connecting line

  function sizeCanvas() {
    const rect = section.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
    const count = Math.min(140, Math.round((w * h) / 16000));   // roughly one dot per 16,000 square px
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
    }));
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);

    // move each dot, and keep it inside the section by bouncing off the edges
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
    }

    // lines between nearby dots: closer pairs get a brighter, thicker line
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = `rgba(25, 230, 193, ${0.22 * (1 - dist / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // dots on top of the lines
    ctx.fillStyle = 'rgba(94, 234, 212, 0.75)';
    for (const d of dots) {
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function loop() { drawFrame(); raf = requestAnimationFrame(loop); }

  let raf = null;
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  sizeCanvas();
  if (prefersReducedMotion) {
    drawFrame(); // draw one still frame, no animation loop
  } else {
    start();
    // pause the animation while the section is off-screen, to save battery
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.01 }).observe(section);
  }

  window.addEventListener('resize', () => { sizeCanvas(); if (prefersReducedMotion) drawFrame(); });
}

// One independent network per section that has a .section-network canvas
// (currently: Work Experience and Coding Profile)
document.querySelectorAll('.section-network').forEach(startParticleNetwork);
