/* main.js — shared interactions */

// ─── THEME TOGGLE ───────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
  const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.style.transform = 'scale(0.9)';
  setTimeout(() => { themeToggle.style.transform = 'scale(1)'; }, 150);
});

// ─── CURSOR ─────────────────────────────────────────────
const dot = document.getElementById('cursorDot');
let mouseX = -100, mouseY = -100, dotX = -100, dotY = -100, raf;

function moveDot() {
  dotX += (mouseX - dotX) * 0.15;
  dotY += (mouseY - dotY) * 0.15;
  dot.style.left = dotX + 'px';
  dot.style.top  = dotY + 'px';
  raf = requestAnimationFrame(moveDot);
}
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (!raf) moveDot();
});
document.addEventListener('mouseleave', () => { 
  dot.style.opacity = '0'; 
  cancelAnimationFrame(raf); 
  raf = null; 
});
document.addEventListener('mouseenter', () => { 
  dot.style.opacity = ''; 
  if (!raf) moveDot();
});

document.querySelectorAll('a, button, .stat-card, .skill-card, .project-item, .ach-card, .writeup-card, .btn').forEach(el => {
  el.addEventListener('mouseenter', () => dot.classList.add('hover'));
  el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
});

// ─── NAV ────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });
nav.classList.toggle('scrolled', window.scrollY > 20);

// Active nav link based on current page
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  // Mark active if the path ends with the page or is the index
  if (
    (href === '/' && (currentPath === '/' || currentPath.endsWith('index.html') && !currentPath.includes('/projects') && !currentPath.includes('/writeups'))) ||
    (href !== '/' && currentPath.includes(href.replace('../', '').replace('.html', '')))
  ) {
    a.classList.add('active');
  }
});

// ─── SCROLL REVEAL ──────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
    const idx = siblings.indexOf(entry.target);
    entry.target.style.transitionDelay = (idx * 0.08) + 's';
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── SMOOTH SCROLL ──────────────────────────────────────
document.querySelectorAll('.nav-links a[href^="#"], a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});
