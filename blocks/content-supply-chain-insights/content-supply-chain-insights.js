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
  block.closest('.section')?.classList.add('ocs-runtime-section', 'ocs-insights-section');
  const title = cfg.title || 'Source Document Insights';
  const emptySummary = cfg.emptySummary || 'Run estimate to generate an envelope preview from langextract output.';

  block.innerHTML = `
    <section class="ocs-card">
      <h3>${title}</h3>
      <p data-ocs-el="envelopeSummary" class="ocs-muted">${emptySummary}</p>
      <div data-ocs-el="envelopeEntities" class="ocs-meta-strip"></div>
    </section>

    <section data-ocs-el="successCard" class="ocs-card hidden">
      <h3>Proposal Accepted</h3>
      <p class="ocs-muted">Fabric receipt issued. Track settlement and validator finalization below.</p>
      <div class="ocs-success-links">
        <a data-ocs-el="txLink" target="_blank" rel="noreferrer">View transaction</a>
        <a data-ocs-el="statusLink" target="_blank" rel="noreferrer">View proposal status</a>
      </div>
      <p data-ocs-el="writeState" class="ocs-status">Proposal finalized.</p>
      <div class="ocs-success-grid">
        <div>
          <span>Content ID</span>
          <code data-ocs-el="contentCid">-</code>
        </div>
        <div>
          <span>Transaction</span>
          <code data-ocs-el="txHash">-</code>
        </div>
      </div>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
