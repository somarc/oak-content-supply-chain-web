import { bootContentSupplyChainRuntime } from '../content-supply-chain-app/content-supply-chain-app.js';

function readConfig(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const cfg = {};
  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;
    const key = (cols[0].textContent || '').trim();
    const value = (cols[1].textContent || '').trim();
    if (key) cfg[key] = value;
  });
  return cfg;
}

export default function decorate(block) {
  const cfg = readConfig(block);
  block.closest('main')?.classList.add('ocs-runtime-page');
  block.closest('.section')?.classList.add('ocs-runtime-section', 'ocs-envelope-section');
  const title = cfg.title || 'Repository Mapping: JCR Envelope';
  const emptyState = cfg.emptyState || '{"status":"awaiting-envelope"}';

  block.innerHTML = `
    <section class="ocs-card ocs-envelope-card">
      <h3>${title}</h3>
      <pre data-ocs-el="envelopeJson" class="ocs-envelope-json">${emptyState}</pre>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
