import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function nodeToHtml(node) {
  const wrapper = document.createElement('div');
  wrapper.append(node.cloneNode(true));
  return wrapper.innerHTML;
}

function nodeToText(node) {
  return (node.textContent || '').trim();
}

function toDisplayLabel(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readLiveNetwork() {
  const source = document.querySelector('[data-ocs-el="networkPill"], [data-el="networkPill"]');
  const raw = (source?.textContent || '').trim();
  if (!raw) return null;
  return toDisplayLabel(raw.replace(/[_-]+/g, ' '));
}

function wireDynamicFooterSignals(shell) {
  const networkSignal = shell.querySelector('[data-footer-signal="network"]');
  if (!networkSignal) return;

  const render = () => {
    const live = readLiveNetwork();
    if (live) networkSignal.textContent = `Network: ${live}`;
  };

  render();

  const source = document.querySelector('[data-ocs-el="networkPill"], [data-el="networkPill"]');
  if (source) {
    const observer = new MutationObserver(render);
    observer.observe(source, { childList: true, characterData: true, subtree: true });
  }

  window.addEventListener('ocs:wallet-state', render);
}

function sanitizeValue(value) {
  return String(value || '')
    .replace(/\\\|/g, '|')
    .replace(/\\\+/g, '+')
    .trim();
}

function footerShell() {
  const shell = document.createElement('div');
  shell.className = 'ocs-footer-shell';
  shell.innerHTML = `
    <section class="ocs-footer-col ocs-footer-brand">
      <h4></h4>
      <p></p>
    </section>
    <section class="ocs-footer-col ocs-footer-signals">
      <h5>Runtime Signals</h5>
      <ul></ul>
    </section>
    <section class="ocs-footer-col ocs-footer-links">
      <h5>Operations</h5>
      <ul></ul>
    </section>
    <section class="ocs-footer-col ocs-footer-legal">
      <h5>Notes</h5>
      <p></p>
      <p></p>
    </section>
  `;
  return shell;
}

function buildFooterGridFromData(footer, data) {
  const shell = footerShell();

  const brandTitle = shell.querySelector('.ocs-footer-brand h4');
  const brandBody = shell.querySelector('.ocs-footer-brand p');
  const signalsList = shell.querySelector('.ocs-footer-signals ul');
  const linksList = shell.querySelector('.ocs-footer-links ul');
  const legalRows = shell.querySelectorAll('.ocs-footer-legal p');

  brandTitle.textContent = sanitizeValue(data.brandTitle || 'Oak Content Supply Chain');
  brandBody.textContent = sanitizeValue(data.brandBody || '');

  ['signal1', 'signal2', 'signal3', 'signal4'].forEach((key) => {
    const text = sanitizeValue(data[key] || '');
    if (!text) return;
    const li = document.createElement('li');
    li.textContent = text;
    if (/^network\s*:/i.test(text)) li.dataset.footerSignal = 'network';
    signalsList.append(li);
  });

  [1, 2, 3, 4, 5].forEach((i) => {
    const label = sanitizeValue(data[`link${i}Label`] || '');
    const href = sanitizeValue(data[`link${i}Href`] || '');
    if (!label) return;
    const item = document.createElement('li');
    if (href) {
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.textContent = label;
      item.append(anchor);
    } else {
      item.textContent = label;
    }
    linksList.append(item);
  });

  legalRows[0].textContent = sanitizeValue(data.legal1 || '');
  legalRows[1].textContent = sanitizeValue(data.legal2 || '');

  footer.replaceChildren(shell);
  wireDynamicFooterSignals(shell);
}

function readFooterMetaTable(footer) {
  const table = footer.querySelector('table');
  if (!table) return null;

  const firstCell = table.querySelector('tr:first-child th, tr:first-child td');
  const firstLabel = (firstCell?.textContent || '').trim().toLowerCase();
  if (!firstLabel.includes('footer meta')) return null;

  const data = {};
  table.querySelectorAll('tr').forEach((row) => {
    const cells = [...row.querySelectorAll('th, td')];
    if (cells.length < 2) return;
    const key = (cells[0].textContent || '').trim();
    if (!key || /footer meta/i.test(key) || key === '---') return;
    data[key] = (cells[1].textContent || '').trim();
  });
  return Object.keys(data).length ? data : null;
}

function readFooterMetaFlatPairs(footer) {
  const lines = [...footer.querySelectorAll('p, li, div')]
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean);

  if (!lines.length) return null;
  const data = {};
  const keyPattern = /^(brandTitle|brandBody|signal[1-4]|link[1-5](Label|Href)|legal[12])$/;
  for (let i = 0; i < lines.length - 1; i += 1) {
    const key = lines[i];
    if (!keyPattern.test(key)) continue;
    const value = lines[i + 1];
    if (!value || keyPattern.test(value)) continue;
    data[key] = value;
    i += 1;
  }

  return Object.keys(data).length >= 8 ? data : null;
}

function buildFooterGridFromList(footer, listItems) {
  const data = {
    brandTitle: nodeToText(listItems[0]),
    brandBody: nodeToText(listItems[1]),
    signal1: nodeToText(listItems[2]),
    signal2: nodeToText(listItems[3]),
    signal3: nodeToText(listItems[4]),
    signal4: nodeToText(listItems[5]),
    legal1: nodeToText(listItems[11]),
    legal2: nodeToText(listItems[12]),
  };

  [6, 7, 8, 9, 10].forEach((i, idx) => {
    const entry = listItems[i];
    const label = nodeToText(entry);
    const anchor = entry.querySelector('a');
    data[`link${idx + 1}Label`] = label;
    data[`link${idx + 1}Href`] = anchor?.getAttribute('href') || '';
  });

  buildFooterGridFromData(footer, data);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta || '/footer';
  let fragment = await loadFragment(footerPath);
  if (!fragment && footerPath !== '/footer') {
    fragment = await loadFragment('/footer');
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  if (fragment) {
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  }

  const footerMetaData = readFooterMetaTable(footer);
  if (footerMetaData) {
    buildFooterGridFromData(footer, footerMetaData);
    block.append(footer);
    return;
  }

  const flatMetaData = readFooterMetaFlatPairs(footer);
  if (flatMetaData) {
    buildFooterGridFromData(footer, flatMetaData);
    block.append(footer);
    return;
  }

  const listItems = [...footer.querySelectorAll('li')];
  if (listItems.length >= 13) {
    buildFooterGridFromList(footer, listItems);
  }

  block.append(footer);
}
