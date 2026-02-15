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
  block.closest('.section')?.classList.add('ocs-runtime-section', 'ocs-operator-settings-section');
  block.innerHTML = `
    <section class="ocs-card ocs-operator-card">
      <h3>${cfg.title || 'Operator Settings'}</h3>
      <div class="ocs-dev-grid">
        <label>${cfg.walletLabel || 'Wallet Override'}
          <input data-ocs-el="wallet" name="wallet" value="0x742d35Cc6634c0532925a3b844bc9e7595f0beb" />
        </label>
        <label>${cfg.orgLabel || 'Organization'}
          <input data-ocs-el="org" name="organization" value="example-org" />
        </label>
        <label>${cfg.validatorUrlLabel || 'Validator URL'}
          <input data-ocs-el="validatorUrl" name="validator_url" value="http://127.0.0.1:8787/ops/v1/content-chain/validator" />
        </label>
        <label>${cfg.normalizerUrlLabel || 'Normalizer API URL'}
          <input data-ocs-el="normalizerUrl" name="normalizer_url" value="http://127.0.0.1:8088" />
        </label>
        <label>${cfg.paymentRecipientLabel || 'Payment Recipient Override'}
          <input data-ocs-el="paymentRecipientOverride" name="payment_recipient_override" placeholder="optional 0x..." />
        </label>
        <label>${cfg.ipfsModeLabel || 'IPFS Mode'}
          <select data-ocs-el="ipfsMode" name="ipfs_mode">
            <option value="validator">validator-hosted binary (server-side CID)</option>
            <option value="client">client-provided CID (client-side IPFS)</option>
          </select>
        </label>
        <label>${cfg.clientCidLabel || 'Client CID (if client mode)'}
          <input data-ocs-el="clientIpfsCid" name="client_ipfs_cid" placeholder="Qm... or bafy..." />
        </label>
      </div>

      <div class="ocs-meta-strip">
        <p class="ocs-pill" data-ocs-el="validatorHealth">validator: unknown</p>
        <p class="ocs-pill" data-ocs-el="normalizerHealth">normalizer: unknown</p>
      </div>
      <pre data-ocs-el="devOut">{"status":"dev-idle"}</pre>
    </section>
  `;

  requestAnimationFrame(() => bootContentSupplyChainRuntime(document));
}
