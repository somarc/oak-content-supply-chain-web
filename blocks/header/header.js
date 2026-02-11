import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAllNavSections(sections) {
  sections.querySelectorAll(':scope .nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? forceExpanded : nav.getAttribute('aria-expanded') !== 'true';
  document.body.style.overflowY = expanded ? 'hidden' : '';
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');

  if (!expanded) {
    closeAllNavSections(navSections);
  }

  const button = nav.querySelector('.nav-hamburger button');
  button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
}

function decorateNavSections(navSections) {
  navSections.querySelectorAll(':scope .nav-sections > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) {
      navSection.classList.add('nav-drop');
      navSection.setAttribute('aria-expanded', 'false');
    }
  });
}

function buildNav(fragment) {
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';

  const sections = fragment.querySelectorAll(':scope > div');
  const brand = sections[0] || document.createElement('div');
  const navSections = sections[1] || document.createElement('div');
  const tools = sections[2] || document.createElement('div');

  brand.className = 'nav-brand';
  navSections.className = 'nav-sections';
  tools.className = 'nav-tools';

  decorateNavSections(navSections);

  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav, navSections));

  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) {
      document.body.style.overflowY = '';
      nav.setAttribute('aria-expanded', 'false');
      closeAllNavSections(navSections);
    }
  });

  nav.append(brand, hamburger, navSections, tools);
  return nav;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta || '/nav';
  let fragment = await loadFragment(navPath);

  if (!fragment && navPath !== '/nav') {
    fragment = await loadFragment('/nav');
  }

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  if (fragment) {
    wrapper.append(buildNav(fragment));
  }

  block.append(wrapper);
}
