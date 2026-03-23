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
      <div class="ocs-envelope-editor">
        <p class="ocs-muted">JSON structure is locked. Edit only safe text fields.</p>
        <div class="ocs-envelope-editor-grid">
          <label>Document Title
            <input data-ocs-el="envelopeEditTitle" maxlength="180" placeholder="Title" />
          </label>
          <label>Document Language
            <input data-ocs-el="envelopeEditLanguage" maxlength="12" placeholder="en" />
          </label>
          <label class="ocs-envelope-editor-full">Source URI
            <input data-ocs-el="envelopeEditSourceUri" maxlength="1000" placeholder="https://example.org/source" />
          </label>
          <label class="ocs-envelope-editor-full">Document Summary
            <textarea data-ocs-el="envelopeEditSummary" maxlength="2000" rows="3" placeholder="Summary"></textarea>
          </label>
        </div>
        <div class="ocs-envelope-editor-actions">
          <button type="button" data-ocs-el="envelopeApplyBtn" class="ocs-envelope-editor-btn">Apply text edits</button>
          <button type="button" data-ocs-el="envelopeResetBtn" class="ocs-envelope-editor-btn ocs-envelope-editor-btn-ghost">Reset fields</button>
        </div>
        <p data-ocs-el="envelopeEditStatus" class="ocs-envelope-edit-status">No envelope loaded yet.</p>
      </div>
      <pre data-ocs-el="envelopeJson" class="ocs-envelope-json">${emptyState}</pre>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
