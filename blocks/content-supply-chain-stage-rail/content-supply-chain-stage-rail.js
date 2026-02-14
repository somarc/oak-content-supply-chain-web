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
  block.closest('.section')?.classList.add('ocs-runtime-section', 'ocs-stage-rail-section');
  block.innerHTML = `
    <section class="ocs-split ocs-stage-rail">
      <h3>${cfg.title || 'Stage Content'}</h3>
      <p class="ocs-muted">${cfg.description || 'Drop a source file, extract envelope, then submit a signed proposal write.'}</p>

      <div class="ocs-meta-strip">
        <p data-ocs-el="walletPill" class="ocs-pill warn">Wallet not connected</p>
        <p data-ocs-el="filePill" class="ocs-pill">No file selected</p>
      </div>

      <div data-ocs-el="drop" class="ocs-dropzone">
        <input data-ocs-el="file" type="file" class="ocs-file-input" />
        <p class="ocs-drop-title">${cfg.dropLabel || 'Drop PDF / TEXT payload'}</p>
        <p class="ocs-drop-sub">${cfg.dropHint || 'or click to browse'}</p>
      </div>

      <label class="ocs-label" for="ocs-intent">Extraction Intent</label>
      <div id="ocs-intent" class="ocs-intent">
        <button type="button" data-intent="quick" class="ocs-intent-btn">Quick</button>
        <button type="button" data-intent="balanced" class="ocs-intent-btn is-active">Balanced</button>
        <button type="button" data-intent="deep" class="ocs-intent-btn">Deep</button>
      </div>
      <p class="ocs-muted" data-ocs-el="intentSummary">Balanced depth with strong metadata and hierarchy extraction.</p>

      <div class="ocs-quote">
        <span>${cfg.quoteLabel || 'Estimated Proposal Cost'}</span>
        <strong data-ocs-el="quoteLabel">Connect wallet and estimate proposal cost</strong>
      </div>

      <button data-ocs-el="writeBtn" class="ocs-btn ocs-btn-primary">${cfg.ctaLabel || 'Connect wallet'}</button>
      <p data-ocs-el="status" class="ocs-status">Ready</p>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
