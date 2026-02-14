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
  block.closest('.section')?.classList.add('ocs-runtime-section', 'ocs-telemetry-section');
  block.innerHTML = `
    <section class="ocs-card ocs-telemetry-shell">
      <h3>${cfg.title || 'Technical Details'}</h3>
      <div class="ocs-technical-grid">
        <section class="ocs-card ocs-progress">
          <h3>${cfg.flowTitle || 'Execution Flow'}</h3>
          <ol data-ocs-el="steps" class="ocs-steps">
            <li data-step="preflight">Validate endpoints</li>
            <li data-step="connect">Connect wallet</li>
            <li data-step="register">Prepare write session</li>
            <li data-step="extract">Extract and envelope</li>
            <li data-step="price">Estimate cost</li>
            <li data-step="commit">Submit proposal</li>
            <li data-step="done">Done</li>
          </ol>
        </section>

        <section class="ocs-card ocs-ledger">
          <h3>${cfg.telemetryTitle || 'Network Telemetry'}</h3>
          <div class="ocs-ledger-kv"><span>Queue</span><strong data-ocs-el="queueDepth">n/a</strong></div>
          <div class="ocs-ledger-kv"><span>Pending</span><strong data-ocs-el="pendingCount">n/a</strong></div>
          <div class="ocs-ledger-kv"><span>Finalized</span><strong data-ocs-el="finalizedCount">n/a</strong></div>
          <div class="ocs-ledger-feed">
            <p class="ocs-feed-head">${cfg.activityTitle || 'activity'}</p>
            <ul data-ocs-el="txFeed"><li><span>NOW</span> awaiting first write...</li></ul>
          </div>
        </section>
      </div>

      <section class="ocs-card ocs-troubleshoot">
        <h3>${cfg.troubleshootTitle || 'Proposal Flow Troubleshooting'}</h3>
        <p data-ocs-el="diagSummary" class="ocs-muted">No active failures. Run estimate to capture diagnostics.</p>
        <ul data-ocs-el="diagList" class="ocs-diag-list"></ul>
        <p data-ocs-el="diagHint" class="ocs-status">${cfg.hintDefault || 'Next action: connect wallet, estimate proposal cost, then sign proposal.'}</p>
      </section>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
