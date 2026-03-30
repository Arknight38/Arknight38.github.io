/* main.js — portfolio interactions */

// ─── CURSOR ───────────────────────────────────────────────
const dot = document.getElementById('cursorDot');
let mouseX = -100, mouseY = -100;
let dotX = -100, dotY = -100;
let raf;

function moveDot() {
  // Smooth lag follow
  dotX += (mouseX - dotX) * 0.18;
  dotY += (mouseY - dotY) * 0.18;
  dot.style.left = dotX + 'px';
  dot.style.top  = dotY + 'px';
  raf = requestAnimationFrame(moveDot);
}

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!raf) moveDot();
});

document.addEventListener('mouseleave', () => {
  dot.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  dot.style.opacity = '';
});

// Grow dot on interactive elements
const hoverTargets = 'a, button, .stat-card, .skill-card, .project-item, .ach-card, .btn';
document.querySelectorAll(hoverTargets).forEach(el => {
  el.addEventListener('mouseenter', () => dot.classList.add('hover'));
  el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
});


// ─── NAV SCROLL STATE ─────────────────────────────────────
const nav = document.getElementById('nav');

function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();


// ─── SCROLL REVEAL ────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    // Stagger siblings that appear at the same time
    const parent = entry.target.parentElement;
    const siblings = [...parent.querySelectorAll('.reveal:not(.visible)')];
    const idx = siblings.indexOf(entry.target);
    entry.target.style.transitionDelay = (idx * 0.06) + 's';
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });

revealEls.forEach(el => revealObserver.observe(el));


// ─── NAV ACTIVE LINK ──────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id], div[id]');

function updateActiveLink() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navLinks.forEach(a => {
    const matches = a.getAttribute('href') === '#' + current;
    a.style.color = matches ? 'var(--text)' : '';
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });


// ─── SMOOTH SCROLL FOR NAV LINKS ──────────────────────────
navLinks.forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});