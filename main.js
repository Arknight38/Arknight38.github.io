/* main.js — portfolio interactions */

// ─── THEME TOGGLE ───────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check for saved theme preference or default to light
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
  const theme = html.getAttribute('data-theme');
  const newTheme = theme === 'light' ? 'dark' : 'light';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Add a little animation to the toggle
  themeToggle.style.transform = 'scale(0.9)';
  setTimeout(() => {
    themeToggle.style.transform = 'scale(1)';
  }, 150);
});

// ─── CURSOR ───────────────────────────────────────────────
const dot = document.getElementById('cursorDot');
let mouseX = -100, mouseY = -100;
let dotX = -100, dotY = -100;
let raf;

function moveDot() {
  // Smooth lag follow with spring physics
  const dx = mouseX - dotX;
  const dy = mouseY - dotY;
  dotX += dx * 0.15;
  dotY += dy * 0.15;
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

// Enhanced hover effects
const hoverTargets = 'a, button, .stat-card, .skill-card, .project-item, .ach-card, .btn';
document.querySelectorAll(hoverTargets).forEach(el => {
  el.addEventListener('mouseenter', () => {
    dot.classList.add('hover');
    // Add subtle scale effect
    el.style.transform = el.style.transform ? el.style.transform.replace('translateY(-4px)', 'translateY(-4px) scale(1.02)') : 'scale(1.02)';
  });
  el.addEventListener('mouseleave', () => {
    dot.classList.remove('hover');
    // Remove scale effect
    el.style.transform = el.style.transform ? el.style.transform.replace(' scale(1.02)', '') : '';
  });
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
    entry.target.style.transitionDelay = (idx * 0.1) + 's';
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// Add parallax effect to hero section
const hero = document.getElementById('hero');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const heroHeight = hero.offsetHeight;
  const parallaxSpeed = 0.3;
  
  if (scrolled < heroHeight) {
    const yPos = -(scrolled * parallaxSpeed);
    hero.style.transform = `translateY(${yPos}px)`;
  }
}, { passive: true });

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