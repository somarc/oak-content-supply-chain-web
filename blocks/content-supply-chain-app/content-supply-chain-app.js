function pretty(data) {
  return JSON.stringify(data, null, 2);
}

function normalizeAddress(raw) {
  const value = String(raw || '').trim();
  const match = value.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : value;
}

function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function buildUrl(base, path) {
  const cleanBase = String(base || '').replace(/\/+$/, '');
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

function inferNetworkName(config) {
  const candidate = String(
    config?.mode
    || config?.blockchainMode
    || config?.networkMode
    || config?.network
    || config?.ethereumNetwork
    || config?.chain
    || config?.chainName
    || '',
  ).toLowerCase();
  if (candidate.includes('sepolia')) return 'sepolia';
  if (candidate.includes('main')) return 'mainnet';
  return 'unknown';
}

function etherscanTxUrl(network, txHash) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ''))) return null;
  if (network === 'sepolia') return `https://sepolia.etherscan.io/tx/${txHash}`;
  if (network === 'mainnet') return `https://etherscan.io/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

function shortAddress(address) {
  const value = String(address || '');
  if (!value) return '-';
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function chainLabelFromId(chainId) {
  const value = String(chainId || '').toLowerCase();
  if (value === '0x1') return 'Ethereum';
  if (value === '0xaa36a7') return 'Sepolia';
  if (value === '0xa4b1') return 'Arbitrum';
  if (value === '0x2105') return 'Base';
  return value ? `Chain ${value}` : 'Unknown';
}

function normalizeChainId(chainId) {
  if (chainId === null || chainId === undefined) return null;
  const raw = String(chainId).trim().toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('0x')) {
    try {
      return `0x${BigInt(raw).toString(16)}`;
    } catch (_e) {
      return raw;
    }
  }
  if (/^\d+$/.test(raw)) {
    try {
      return `0x${BigInt(raw).toString(16)}`;
    } catch (_e) {
      return null;
    }
  }
  return raw;
}

function expectedChainIdForNetwork(network) {
  if (network === 'sepolia') return '0xaa36a7';
  if (network === 'mainnet') return '0x1';
  return null;
}

function chainNameForId(chainId) {
  const normalized = normalizeChainId(chainId);
  if (normalized === '0xaa36a7') return 'Sepolia';
  if (normalized === '0x1') return 'Ethereum';
  return chainLabelFromId(normalized);
}

function toHexQuantity(value) {
  const n = typeof value === 'bigint' ? value : BigInt(value || 0);
  return `0x${n.toString(16)}`;
}

function generateProposalIdHex() {
  const bytes = new Uint8Array(32);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

function describeError(error) {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  const message = error?.message
    || error?.reason
    || error?.shortMessage
    || error?.data?.message
    || error?.error?.message;
  if (message) return String(message);
  try {
    return JSON.stringify(error);
  } catch (_e) {
    return String(error);
  }
}

function describePayloadError(payload, fallback) {
  const candidate = payload?.error || payload?.message || fallback || 'unknown error';
  if (typeof candidate === 'string') return candidate;
  return describeError(candidate);
}

function formatWeiToEth(weiHexOrDecimal) {
  if (weiHexOrDecimal === null || weiHexOrDecimal === undefined) return '-';
  let wei;
  try {
    const raw = String(weiHexOrDecimal);
    wei = raw.startsWith('0x') ? BigInt(raw) : BigInt(raw || '0');
  } catch (_e) {
    return '-';
  }
  const whole = wei / 1000000000000000000n;
  const fractional = wei % 1000000000000000000n;
  const frac4 = (fractional / 100000000000000n).toString().padStart(4, '0');
  return `${whole.toString()}.${frac4}`;
}

function safeNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getObjectPath(root, path) {
  let node = root;
  for (const key of path) {
    if (!node || typeof node !== 'object') return '';
    node = node[key];
  }
  return typeof node === 'string' ? node : '';
}

function setObjectPath(root, path, value) {
  if (!root || typeof root !== 'object' || !Array.isArray(path) || path.length === 0) return;
  let node = root;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const next = node[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) node[key] = {};
    node = node[key];
  }
  node[path[path.length - 1]] = value;
}

function guessEthUsdPrice(config) {
  const candidate = safeNumber(
    config?.ethUsd
    || config?.ethPriceUsd
    || config?.usdPerEth
    || config?.eth_usd
    || config?.priceEthUsd,
    null,
  );
  return candidate && candidate > 0 ? candidate : 3000;
}

function formatUsd(value) {
  const n = safeNumber(value, null);
  if (n === null) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isLikelyIpfsCid(value) {
  const cid = String(value || '').trim();
  if (!cid) return false;
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/.test(cid);
}

function template() {
  return `
    <section class="ocs-shell">
      <header class="ocs-toolbar">
        <div class="ocs-brand">
          <p class="ocs-brand-title">OAK INGEST STUDIO</p>
          <p class="ocs-brand-sub">content supply chain control room</p>
        </div>
        <div class="ocs-toolbar-right">
          <div class="ocs-network">
            <span class="ocs-micro">network</span>
            <strong data-el="networkPill">detecting</strong>
            <span class="ocs-micro">link</span>
            <strong data-el="linkPill">checking</strong>
          </div>
          <div class="ocs-wallet-rail">
            <div class="ocs-wallet-stat">
              <span class="ocs-micro">wallet</span>
              <strong data-el="walletAddress">not connected</strong>
            </div>
            <div class="ocs-wallet-stat">
              <span class="ocs-micro">balance</span>
              <strong data-el="walletBalance">- ETH</strong>
            </div>
            <div class="ocs-wallet-stat">
              <span class="ocs-micro">chain</span>
              <strong data-el="walletChain">unknown</strong>
            </div>
            <button type="button" data-el="connectWalletBtn" class="ocs-wallet-btn">Refresh</button>
            <button type="button" data-el="clearWalletBtn" class="ocs-wallet-btn ocs-wallet-btn-ghost hidden">Clear</button>
          </div>
        </div>
      </header>

      <div class="ocs-workspace">
        <aside class="ocs-card ocs-stage-rail">
          <h3>Stage Content</h3>
          <p class="ocs-muted">Drop a source file, extract envelope, then submit a signed proposal write.</p>
          <div class="ocs-meta-strip">
            <p data-el="walletPill" class="ocs-pill warn">Wallet not connected</p>
            <p data-el="filePill" class="ocs-pill">No file selected</p>
          </div>

          <div data-el="drop" class="ocs-dropzone">
            <input data-el="file" type="file" name="source_file" class="ocs-file-input" />
            <p class="ocs-drop-title">Drop PDF / TEXT payload</p>
            <p class="ocs-drop-sub">or click to browse</p>
          </div>

          <p class="ocs-label">Extraction Intent</p>
          <div class="ocs-intent-layout">
            <div class="ocs-intent-main">
              <p class="ocs-intent-heading">Recommended</p>
              <div id="ocs-intent" class="ocs-intent">
                <button type="button" data-intent="quick" class="ocs-intent-btn">Quick</button>
                <button type="button" data-intent="balanced" class="ocs-intent-btn is-active">Balanced</button>
              </div>
            </div>
            <div class="ocs-intent-deep-rail">
              <p class="ocs-intent-heading">Deep Analysis</p>
              <button type="button" data-intent="deep" class="ocs-intent-btn ocs-intent-btn-deep">Deep</button>
            </div>
          </div>
          <p class="ocs-muted" data-el="intentSummary">Balanced depth with strong metadata and hierarchy extraction.</p>
          <p class="ocs-intent-eta" data-el="intentEta">Typical runtime: 1 to 3 minutes for medium files.</p>

          <div class="ocs-quote">
            <span>Estimated Proposal Cost</span>
            <strong data-el="quoteLabel">Connect wallet and estimate proposal cost</strong>
          </div>
          <button data-el="writeBtn" class="ocs-btn ocs-btn-primary">Connect wallet</button>
          <p data-el="status" class="ocs-status">Ready</p>
        </aside>

        <section class="ocs-main-canvas">
          <section class="ocs-card ocs-primary">
            <h3>Source Document Insights</h3>
            <p data-el="envelopeSummary" class="ocs-muted">Run estimate to generate an envelope preview from ingestion output.</p>
            <div data-el="envelopeEntities" class="ocs-meta-strip"></div>
          </section>

          <section class="ocs-card ocs-envelope">
            <h3>Repository Mapping: JCR Envelope</h3>
            <div class="ocs-envelope-editor">
              <p class="ocs-muted">JSON structure is locked. Edit only safe text fields.</p>
              <div class="ocs-envelope-editor-grid">
                <label>Document Title
                  <input data-el="envelopeEditTitle" maxlength="180" placeholder="Title" />
                </label>
                <label>Document Language
                  <input data-el="envelopeEditLanguage" maxlength="12" placeholder="en" />
                </label>
                <label class="ocs-envelope-editor-full">Source URI
                  <input data-el="envelopeEditSourceUri" maxlength="1000" placeholder="https://example.org/source" />
                </label>
                <label class="ocs-envelope-editor-full">Document Summary
                  <textarea data-el="envelopeEditSummary" maxlength="2000" rows="3" placeholder="Summary"></textarea>
                </label>
              </div>
              <div class="ocs-envelope-editor-actions">
                <button type="button" data-el="envelopeApplyBtn" class="ocs-envelope-editor-btn">Apply text edits</button>
                <button type="button" data-el="envelopeResetBtn" class="ocs-envelope-editor-btn ocs-envelope-editor-btn-ghost">Reset fields</button>
              </div>
              <p data-el="envelopeEditStatus" class="ocs-envelope-edit-status">No envelope loaded yet.</p>
            </div>
            <pre data-el="envelopeJson" class="ocs-envelope-json">{"status":"awaiting-envelope"}</pre>
          </section>

          <section data-el="successCard" class="ocs-card ocs-success hidden">
            <h3>Proposal Accepted</h3>
            <p class="ocs-muted">Fabric receipt issued. Track settlement and validator finalization below.</p>
            <div class="ocs-success-links">
              <a data-el="txLink" target="_blank" rel="noreferrer">View transaction</a>
              <a data-el="statusLink" target="_blank" rel="noreferrer">View proposal status</a>
            </div>
            <p data-el="writeState" class="ocs-success-state">Proposal finalized.</p>
            <div class="ocs-success-grid">
              <div>
                <span>Content ID</span>
                <code data-el="contentCid">-</code>
              </div>
              <div>
                <span>Transaction</span>
                <code data-el="txHash">-</code>
              </div>
            </div>
          </section>

          <details class="ocs-technical" open>
            <summary>Technical Details</summary>
            <div class="ocs-technical-grid">
              <section class="ocs-card ocs-progress">
                <h3>Execution Flow</h3>
                <ol data-el="steps" class="ocs-steps">
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
                <h3>Network Telemetry</h3>
                <div class="ocs-ledger-kv">
                  <span>Queue</span>
                  <strong data-el="queueDepth">n/a</strong>
                </div>
                <div class="ocs-ledger-kv">
                  <span>Pending</span>
                  <strong data-el="pendingCount">n/a</strong>
                </div>
                <div class="ocs-ledger-kv">
                  <span>Finalized</span>
                  <strong data-el="finalizedCount">n/a</strong>
                </div>
                <div class="ocs-ledger-feed">
                  <p class="ocs-feed-head">activity</p>
                  <ul data-el="txFeed">
                    <li><span>NOW</span> awaiting first write...</li>
                  </ul>
                </div>
              </section>
            </div>

            <section class="ocs-card ocs-troubleshoot">
              <h3>Proposal Flow Troubleshooting</h3>
              <p data-el="diagSummary" class="ocs-muted">No active failures. Run estimate to capture diagnostics.</p>
              <ul data-el="diagList" class="ocs-diag-list"></ul>
              <p data-el="diagHint" class="ocs-status">Next action: connect wallet, estimate proposal cost, then sign proposal.</p>
            </section>

            <div class="ocs-dev">
              <h4>Operator Settings</h4>
              <div class="ocs-dev-grid">
                <label>Wallet Override
                  <input data-el="wallet" name="wallet" value="0x742d35Cc6634c0532925a3b844bc9e7595f0beb" />
                </label>
                <label>Organization
                  <input data-el="org" name="organization" value="example-org" />
                </label>
                <label>Validator URL
                  <input data-el="validatorUrl" name="validator_url" value="http://127.0.0.1:8787/ops/v1/content-chain/validator" />
                </label>
                <label>Normalizer API URL
                  <input data-el="normalizerUrl" name="normalizer_url" value="http://127.0.0.1:8088" />
                </label>
                <label>Payment Recipient Override
                  <input data-el="paymentRecipientOverride" name="payment_recipient_override" placeholder="optional 0x..." />
                </label>
                <label>IPFS Mode
                  <select data-el="ipfsMode" name="ipfs_mode">
                    <option value="validator">validator-hosted binary (server-side CID)</option>
                    <option value="client">client-provided CID (client-side IPFS)</option>
                  </select>
                </label>
                <label>Client CID (if client mode)
                  <input data-el="clientIpfsCid" name="client_ipfs_cid" placeholder="Qm... or bafy..." />
                </label>
              </div>
              <div class="ocs-dev-endpoint-health">
                <p class="ocs-pill" data-el="validatorHealth">validator: unknown</p>
                <p class="ocs-pill" data-el="normalizerHealth">normalizer: unknown</p>
              </div>
              <pre data-el="devOut">{"status":"dev-idle"}</pre>
            </div>
          </details>
        </section>
      </div>
    </section>
  `;
}

const INTENTS = {
  quick: {
    depth: 'L1',
    promptProfile: 'metadata-quick',
    priceMultiplier: 0.85,
    summary: 'Fast pass with lightweight metadata and ownership envelope.',
    eta: 'Typical runtime: under 1 minute for small to medium files.',
  },
  balanced: {
    depth: 'L2',
    promptProfile: 'assets-metadata-hierarchy',
    priceMultiplier: 1,
    summary: 'Balanced depth with strong metadata and hierarchy extraction.',
    eta: 'Typical runtime: 1 to 3 minutes for medium files.',
  },
  deep: {
    depth: 'L3',
    promptProfile: 'deep-graph-analysis',
    priceMultiplier: 1.35,
    summary: 'Deep extraction for richer contextual graph data. Better fidelity, slower turnaround.',
    eta: 'Longer run time: typically 4 to 8 minutes, longer on dense or large documents.',
  },
};

function summarizeExtractions(normalized) {
  const extractions = normalized?.envelopeDraft?.classification?.extractions;
  if (!Array.isArray(extractions) || extractions.length === 0) {
    return { total: 0, classes: [] };
  }
  const counts = {};
  extractions.forEach((entry) => {
    const cls = sanitizeClassLabel(entry?.class);
    counts[cls] = (counts[cls] || 0) + 1;
  });
  const classes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}:${count}`);
  return { total: extractions.length, classes };
}

function sanitizeClassLabel(value) {
  const raw = String(value || 'unknown').trim();
  const cleaned = raw.replace(/[,:;]+$/g, '').trim();
  return cleaned || 'unknown';
}

const STAGE_HELP = {
  preflight: {
    label: 'Validate endpoints',
    detail: 'Checks connectivity to validator and normalizer APIs before wallet and content operations.',
    endpoint: 'validator /v1/proposals/queue/stats + normalizer /v1/runtime-config',
  },
  connect: {
    label: 'Connect wallet',
    detail: 'Requests account access from MetaMask and validates selected wallet address.',
    endpoint: 'window.ethereum eth_requestAccounts',
  },
  register: {
    label: 'Prepare write session',
    detail: 'Registers the connected client session with validator API.',
    endpoint: 'validator /v1/register-client',
  },
  extract: {
    label: 'Extract and envelope',
    detail: 'Uploads file for extraction and maps envelope into deterministic JCR structure.',
    endpoint: 'normalizer /v1/ingress/normalize-upload + /v1/envelopes/jcr-map',
  },
  price: {
    label: 'Estimate cost',
    detail: 'Requests proposal fee quote for the current draft and depth profile.',
    endpoint: 'normalizer /v1/pricing/envelope-quote',
  },
  commit: {
    label: 'Submit proposal',
    detail: 'Submits payment tx, signs proposal payload, then posts either client CID or validator-hosted binary.',
    endpoint: 'MetaMask tx/sign + validator /v1/propose-write',
  },
  done: {
    label: 'Done',
    detail: 'Shows receipt metadata and polls proposal status until final state.',
    endpoint: 'validator /v1/proposals/{id}/status',
  },
};

function ensureOpsCollapsibleSection(root = document) {
  const main = root.querySelector?.('main.ocs-runtime-page') || document.querySelector('main.ocs-runtime-page');
  if (!main || main.querySelector('.section.ocs-ops-collapse-section')) return;

  const telemetrySection = main.querySelector(':scope > .section.ocs-telemetry-section');
  const operatorSection = main.querySelector(':scope > .section.ocs-operator-settings-section');
  if (!telemetrySection || !operatorSection) return;

  const collapseSection = document.createElement('div');
  collapseSection.className = 'section ocs-runtime-section ocs-ops-collapse-section';
  collapseSection.innerHTML = `
    <details class="ocs-ops-collapse">
      <summary>Operator Settings, Technical Details & Troubleshooting</summary>
      <div class="ocs-ops-collapse-body"></div>
    </details>
  `;

  const body = collapseSection.querySelector('.ocs-ops-collapse-body');
  const telemetryBeforeOperator = Boolean(
    telemetrySection.compareDocumentPosition(operatorSection) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const first = telemetryBeforeOperator ? telemetrySection : operatorSection;
  main.insertBefore(collapseSection, first);
  body.append(telemetrySection, operatorSection);
}

export function bootContentSupplyChainRuntime(root = document) {
  const scope = root && typeof root.querySelector === 'function' ? root : document;
  const mainEl = (
    root && typeof root.closest === 'function' ? root.closest('main') : null
  ) || scope.querySelector('main.ocs-runtime-page') || document.querySelector('main.ocs-runtime-page');
  if (mainEl?.dataset?.ocsRuntimeBooted === 'true') return true;
  ensureOpsCollapsibleSection(scope);
  mainEl?.classList.add('ocs-stage-mode');

  const state = {
    selectedFile: null,
    connectedWallet: null,
    runtimeConfig: { normalizerMode: 'mock', mockWalletFlow: false },
    isRegistered: false,
    discoveredPaymentTarget: null,
    walletBalanceEth: null,
    walletChainId: null,
    walletChainLabel: 'unknown',
    walletProvider: null,
    latestEnvelope: null,
    latestNormalization: null,
    latestQuote: null,
    preparedDraftKey: null,
    selectedIntent: 'balanced',
    busy: false,
    blockchainConfig: null,
    expectedChainId: null,
    ipfsMode: 'validator',
    statusPollTimer: null,
    queuePollTimer: null,
    stageState: {},
    lastFlowError: '',
    lastFailedStep: '',
    envelopeEditorBoundTo: null,
  };

  const q = (name) => scope.querySelector(`[data-ocs-el="${name}"], [data-el="${name}"]`);
  const els = {
    writeBtn: q('writeBtn'),
    networkPill: q('networkPill'),
    linkPill: q('linkPill'),
    walletPill: q('walletPill'),
    walletAddress: q('walletAddress'),
    walletBalance: q('walletBalance'),
    walletChain: q('walletChain'),
    connectWalletBtn: q('connectWalletBtn'),
    clearWalletBtn: q('clearWalletBtn'),
    filePill: q('filePill'),
    status: q('status'),
    drop: q('drop'),
    file: q('file'),
    steps: q('steps'),
    quoteLabel: q('quoteLabel'),
    envelopeSummary: q('envelopeSummary'),
    envelopeEntities: q('envelopeEntities'),
    envelopeJson: q('envelopeJson'),
    successCard: q('successCard'),
    contentCid: q('contentCid'),
    txHash: q('txHash'),
    queueDepth: q('queueDepth'),
    pendingCount: q('pendingCount'),
    finalizedCount: q('finalizedCount'),
    txFeed: q('txFeed'),
    txLink: q('txLink'),
    statusLink: q('statusLink'),
    writeState: q('writeState'),
    intentSummary: q('intentSummary'),
    intentEta: q('intentEta'),
    envelopeEditTitle: q('envelopeEditTitle'),
    envelopeEditSummary: q('envelopeEditSummary'),
    envelopeEditSourceUri: q('envelopeEditSourceUri'),
    envelopeEditLanguage: q('envelopeEditLanguage'),
    envelopeApplyBtn: q('envelopeApplyBtn'),
    envelopeResetBtn: q('envelopeResetBtn'),
    envelopeEditStatus: q('envelopeEditStatus'),
    devOut: q('devOut'),
    wallet: q('wallet'),
    org: q('org'),
    validatorUrl: q('validatorUrl'),
    normalizerUrl: q('normalizerUrl'),
    paymentRecipientOverride: q('paymentRecipientOverride'),
    ipfsMode: q('ipfsMode'),
    clientIpfsCid: q('clientIpfsCid'),
    validatorHealth: q('validatorHealth'),
    normalizerHealth: q('normalizerHealth'),
    diagSummary: q('diagSummary'),
    diagList: q('diagList'),
    diagHint: q('diagHint'),
    snapshotFlow: q('snapshotFlow'),
    snapshotStage: q('snapshotStage'),
    snapshotEntities: q('snapshotEntities'),
    snapshotConfidence: q('snapshotConfidence'),
    snapshotMeter: q('snapshotMeter'),
  };

  const required = ['writeBtn', 'drop', 'file', 'steps', 'quoteLabel', 'envelopeSummary', 'envelopeJson', 'txFeed', 'wallet', 'org', 'validatorUrl', 'normalizerUrl', 'devOut'];
  if (required.some((key) => !els[key])) return false;

  const setStageEngaged = () => {
    mainEl?.classList.add('ocs-stage-engaged');
  };

  const revealPrimaryPanels = () => {
    mainEl?.classList.add('ocs-panels-visible');
  };

  const ensureWalletHelpModal = () => {
    let modal = document.querySelector('.ocs-wallet-help-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'ocs-wallet-help-modal hidden';
    modal.innerHTML = `
      <div class="ocs-wallet-help-backdrop" data-wallet-help-close="backdrop"></div>
      <section class="ocs-wallet-help-dialog" role="dialog" aria-modal="true" aria-labelledby="ocs-wallet-help-title">
        <header class="ocs-wallet-help-head">
          <h3 id="ocs-wallet-help-title">Connect a Wallet</h3>
          <button type="button" class="ocs-wallet-help-close" data-wallet-help-close="button" aria-label="Close">×</button>
        </header>
        <p class="ocs-wallet-help-copy">No EVM wallet provider was detected in this browser. Install a wallet extension or app, then refresh and connect.</p>
        <div class="ocs-wallet-help-grid">
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">MetaMask</a>
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noreferrer">Coinbase Wallet</a>
          <a href="https://rabby.io/" target="_blank" rel="noreferrer">Rabby</a>
          <a href="https://walletconnect.com/" target="_blank" rel="noreferrer">WalletConnect</a>
        </div>
        <p class="ocs-wallet-help-note">Wallets are used to sign transactions and prove ownership for Sepolia proposal writes.</p>
      </section>
    `;
    modal.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.dataset.walletHelpClose) return;
      modal.classList.add('hidden');
      modal.classList.remove('is-open');
    });
    document.body.append(modal);
    return modal;
  };

  const showWalletHelpModal = () => {
    const modal = ensureWalletHelpModal();
    modal.classList.remove('hidden');
    modal.classList.add('is-open');
  };

  const setStatus = (msg) => {
    els.status.textContent = msg;
    updateRailSnapshot();
  };

  const setDev = (data) => {
    els.devOut.textContent = pretty(data);
  };

  const setEnvelopeEditStatus = (message, tone = 'info') => {
    if (!els.envelopeEditStatus) return;
    els.envelopeEditStatus.textContent = message;
    els.envelopeEditStatus.classList.remove('is-ok', 'is-warn', 'is-error');
    if (tone === 'ok') els.envelopeEditStatus.classList.add('is-ok');
    if (tone === 'warn') els.envelopeEditStatus.classList.add('is-warn');
    if (tone === 'error') els.envelopeEditStatus.classList.add('is-error');
  };

  const syncEnvelopeEditor = (force = false) => {
    const inputs = [els.envelopeEditTitle, els.envelopeEditSummary, els.envelopeEditSourceUri, els.envelopeEditLanguage].filter(Boolean);
    const buttons = [els.envelopeApplyBtn, els.envelopeResetBtn].filter(Boolean);
    if (inputs.length === 0) return;

    const hasEnvelope = Boolean(state.latestEnvelope);
    inputs.forEach((input) => {
      input.disabled = !hasEnvelope;
    });
    buttons.forEach((button) => {
      button.disabled = !hasEnvelope;
    });

    if (!hasEnvelope) {
      inputs.forEach((input) => {
        input.value = '';
      });
      state.envelopeEditorBoundTo = null;
      setEnvelopeEditStatus('No envelope loaded yet.');
      return;
    }

    if (!force && state.envelopeEditorBoundTo === state.latestEnvelope) return;

    if (els.envelopeEditTitle) els.envelopeEditTitle.value = getObjectPath(state.latestEnvelope, ['document', 'title']);
    if (els.envelopeEditSummary) els.envelopeEditSummary.value = getObjectPath(state.latestEnvelope, ['document', 'summary']);
    if (els.envelopeEditSourceUri) els.envelopeEditSourceUri.value = getObjectPath(state.latestEnvelope, ['source', 'uri']);
    if (els.envelopeEditLanguage) els.envelopeEditLanguage.value = getObjectPath(state.latestEnvelope, ['document', 'language']);
    state.envelopeEditorBoundTo = state.latestEnvelope;
    setEnvelopeEditStatus('Safe text fields ready. JSON structure remains locked.');
  };

  const applyEnvelopeSafeEdits = () => {
    if (!state.latestEnvelope) {
      setEnvelopeEditStatus('Run estimate first to load an envelope.', 'warn');
      return;
    }
    const nextTitle = String(els.envelopeEditTitle?.value || '').trim();
    const nextSummary = String(els.envelopeEditSummary?.value || '').trim();
    const nextSourceUri = String(els.envelopeEditSourceUri?.value || '').trim();
    const nextLanguage = String(els.envelopeEditLanguage?.value || '').trim().toLowerCase();

    if (nextLanguage && !/^[a-z]{2,8}(-[a-z0-9]{2,8})?$/.test(nextLanguage)) {
      setEnvelopeEditStatus('Language should use BCP-47 style tags (for example: en or en-us).', 'error');
      return;
    }

    setObjectPath(state.latestEnvelope, ['document', 'title'], nextTitle);
    setObjectPath(state.latestEnvelope, ['document', 'summary'], nextSummary);
    setObjectPath(state.latestEnvelope, ['source', 'uri'], nextSourceUri);
    setObjectPath(state.latestEnvelope, ['document', 'language'], nextLanguage);
    state.envelopeEditorBoundTo = null;
    renderEnvelopePreview();
    setEnvelopeEditStatus('Applied safe text edits to envelope draft.', 'ok');
    appendFeed('safe envelope text edits applied', 'ok');
  };

  const markEnvelopeEditsDirty = () => {
    if (!state.latestEnvelope) return;
    setEnvelopeEditStatus('Unapplied safe text edits.', 'warn');
  };

  const renderEnvelopePreview = () => {
    const insightsCard = els.envelopeSummary?.closest('.ocs-card');
    if (!state.latestEnvelope) {
      els.envelopeSummary.textContent = 'Run estimate to generate an envelope preview from ingestion output.';
      els.envelopeEntities.innerHTML = '';
      els.envelopeJson.textContent = '{"status":"awaiting-envelope"}';
      insightsCard?.classList.remove('has-entities');
      syncEnvelopeEditor();
      updateRailSnapshot();
      return;
    }

    const confidence = state.latestNormalization?.confidence;
    const extractions = state.latestEnvelope?.classification?.extractions;
    const entityCount = Array.isArray(extractions) ? extractions.length : 0;
    const sourceName = state.latestNormalization?.fileInfo?.fileName || state.selectedFile?.name || 'artifact';
    els.envelopeSummary.textContent = `Envelope ready for ${sourceName}. Confidence ${confidence ?? 'n/a'} with ${entityCount} extracted entities.`;

    const classCounts = {};
    if (Array.isArray(extractions)) {
      extractions.forEach((entry) => {
        const cls = sanitizeClassLabel(entry?.class);
        classCounts[cls] = (classCounts[cls] || 0) + 1;
      });
    }
    const chips = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cls, count]) => `<p class="ocs-pill"><span>${cls}</span><strong>${count}</strong></p>`)
      .join('');
    els.envelopeEntities.innerHTML = chips || '<p class="ocs-pill">No extracted entities</p>';
    els.envelopeJson.textContent = pretty(state.latestEnvelope);
    insightsCard?.classList.toggle('has-entities', Boolean(chips));
    syncEnvelopeEditor();
    updateRailSnapshot();
  };

  const updateRailSnapshot = () => {
    if (!els.snapshotFlow && !els.snapshotStage && !els.snapshotMeter) return;
    const orderedStages = ['preflight', 'connect', 'register', 'extract', 'price', 'commit', 'done'];
    let activeStage = '';
    let stageLabel = 'Awaiting file';
    let flowLabel = state.busy ? 'Processing' : 'Ready';
    let progress = 0;

    for (const key of orderedStages) {
      if (state.stageState[key] === 'active') {
        activeStage = key;
        break;
      }
    }
    if (activeStage) {
      const help = STAGE_HELP[activeStage];
      stageLabel = help?.label || activeStage;
    } else if (state.lastFlowError) {
      flowLabel = 'Error';
      stageLabel = STAGE_HELP[state.lastFailedStep]?.label || 'Retry needed';
    } else if (state.stageState.done === 'done') {
      flowLabel = 'Committed';
      stageLabel = STAGE_HELP.done.label;
    } else if (state.connectedWallet) {
      stageLabel = state.latestEnvelope ? 'Estimate ready' : 'Ready to estimate';
    }

    const completedCount = orderedStages.filter((key) => state.stageState[key] === 'done').length;
    progress = Math.max(progress, Math.round((completedCount / orderedStages.length) * 100));
    if (activeStage) {
      const activeIndex = orderedStages.indexOf(activeStage);
      progress = Math.max(progress, Math.round(((activeIndex + 0.5) / orderedStages.length) * 100));
    }
    if (state.lastFlowError) progress = Math.max(progress, 20);
    if (state.stageState.done === 'done') progress = 100;

    const totalEntities = Array.isArray(state.latestEnvelope?.classification?.extractions)
      ? state.latestEnvelope.classification.extractions.length
      : 0;
    const confidence = state.latestNormalization?.confidence;

    if (els.snapshotFlow) els.snapshotFlow.textContent = flowLabel;
    if (els.snapshotStage) els.snapshotStage.textContent = stageLabel;
    if (els.snapshotEntities) els.snapshotEntities.textContent = String(totalEntities);
    if (els.snapshotConfidence) {
      els.snapshotConfidence.textContent = confidence === undefined || confidence === null
        ? 'n/a'
        : Number(confidence).toFixed(2);
    }
    if (els.snapshotMeter) els.snapshotMeter.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  const appendFeed = (message, level = 'info') => {
    const li = document.createElement('li');
    const stamp = document.createElement('span');
    stamp.textContent = new Date().toISOString().slice(11, 19);
    li.append(stamp, ` ${message}`);
    if (level === 'ok') li.classList.add('is-ok');
    if (level === 'warn') li.classList.add('is-warn');
    if (level === 'error') li.classList.add('is-error');
    els.txFeed.prepend(li);
    while (els.txFeed.children.length > 8) els.txFeed.removeChild(els.txFeed.lastChild);
  };

  const suggestNextAction = (step) => {
    if (step === 'preflight') {
      return `Next action: verify Validator URL (${getValidatorBase()}) and Normalizer URL (${getNormalizerBase()}) are reachable from browser session.`;
    }
    if (step === 'register') {
      return `Next action: verify validator register endpoint at ${buildUrl(getValidatorBase(), '/v1/register-client')} and organization value.`;
    }
    if (step === 'extract') {
      return `Next action: verify extract endpoint at ${buildUrl(getNormalizerBase(), '/v1/ingress/normalize-upload')} and retry with supported file content.`;
    }
    if (step === 'price') {
      return `Next action: verify quote endpoint at ${buildUrl(getNormalizerBase(), '/v1/pricing/envelope-quote')} and retry estimate.`;
    }
    if (step === 'commit') {
      return 'Next action: confirm payment recipient configuration and approve MetaMask transaction + signature prompts.';
    }
    return 'Next action: rerun estimate and inspect developer JSON payload for failing request details.';
  };

  const renderDiagnostics = () => {
    if (!els.diagList) return;
    const order = ['preflight', 'connect', 'register', 'extract', 'price', 'commit', 'done'];
    els.diagList.innerHTML = order
      .map((step) => {
        const help = STAGE_HELP[step];
        const status = state.stageState[step] || 'pending';
        return `
          <li class="is-${status}">
            <div class="ocs-diag-head">
              <strong>${help.label}</strong>
              <span class="ocs-diag-status is-${status}">${status}</span>
            </div>
            <p class="ocs-diag-detail">${help.detail}</p>
            <p class="ocs-diag-endpoint"><span>Endpoint:</span> <code>${help.endpoint}</code></p>
          </li>
        `;
      })
      .join('');

    if (state.lastFlowError) {
      els.diagSummary.textContent = `Last failure: ${state.lastFlowError}`;
      els.diagHint.textContent = suggestNextAction(state.lastFailedStep);
      return;
    }
    els.diagSummary.textContent = 'No active failures. Run estimate to capture diagnostics.';
    els.diagHint.textContent = 'Next action: connect wallet, estimate proposal cost, then sign proposal.';
  };

  const setBusy = (flag) => {
    state.busy = flag;
    mainEl?.classList.toggle('ocs-busy', flag);
    if (!flag) mainEl?.classList.remove('ocs-processing-lx');
    els.writeBtn.disabled = flag;
    if (flag) {
      els.writeBtn.textContent = 'Processing...';
      updateRailSnapshot();
      return;
    }
    updatePrimaryAction();
    updateRailSnapshot();
  };

  const currentDraftKey = () => {
    if (!state.selectedFile || !state.connectedWallet) return null;
    return [
      String(state.connectedWallet).toLowerCase(),
      state.selectedIntent,
      state.selectedFile.name || 'unnamed',
      state.selectedFile.size || 0,
      state.selectedFile.lastModified || 0,
    ].join('|');
  };

  const isPreparedDraftCurrent = () => {
    const key = currentDraftKey();
    return Boolean(
      key
      && state.preparedDraftKey === key
      && state.latestEnvelope
      && state.latestQuote?.totalFeeWei,
    );
  };

  const resetPreparedDraft = () => {
    state.preparedDraftKey = null;
    state.latestEnvelope = null;
    state.latestNormalization = null;
    state.latestQuote = null;
    renderEnvelopePreview();
  };

  const updateQuoteLabelFromCurrent = () => {
    if (!state.latestQuote?.totalFeeWei) {
      els.quoteLabel.textContent = state.connectedWallet ? 'Click "Estimate Proposal Cost"' : 'Connect wallet and estimate proposal cost';
      return;
    }
    const wei = state.latestQuote.totalFeeWei;
    const eth = formatWeiToEth(wei);
    const usd = formatUsd((safeNumber(eth, 0) || 0) * guessEthUsdPrice(state.blockchainConfig || {}));
    const modeHint = state.ipfsMode === 'validator' ? ' | validator binary mode' : ' | client CID mode';
    els.quoteLabel.textContent = `${eth} ETH (~${usd} USDC)${modeHint}`;
  };

  const getNormalizerBase = () => (els.normalizerUrl.value || '').replace(/\/+$/, '');
  const getValidatorBase = () => (els.validatorUrl.value || '').replace(/\/+$/, '');
  const isHosted = () => /\.aem\.(page|live)$/i.test(window.location.hostname);
  const isLocalEndpoint = (url) => /127\.0\.0\.1|localhost/i.test(url || '');
  const endpointHint = () => {
    if (isHosted() && (isLocalEndpoint(getNormalizerBase()) || isLocalEndpoint(getValidatorBase()))) {
      return 'Open Developer Settings and use a public service endpoint (tunnel URL), not localhost.';
    }
    return null;
  };
  const hasHostedLocalEndpoints = () => Boolean(endpointHint());
  const isNetworkError = (error) => /failed to fetch|networkerror|load failed|network request failed/i.test(
    String(error?.message || error),
  );
  const formatFlowError = (step, error) => {
    const hint = endpointHint();
    if (hint && isNetworkError(error)) return `Cannot reach Oak services from this hosted page. ${hint}`;
    if (step === 'preflight') return describeError(error) || 'Service preflight failed. Check validator/normalizer endpoints.';
    if (step === 'register' && isNetworkError(error)) return `Could not prepare your write session via ${buildUrl(getValidatorBase(), '/v1/register-client')}. ${hint || 'Check service connectivity in Developer Settings.'}`;
    if (step === 'extract' && isNetworkError(error)) return `Could not reach normalizer extract endpoint ${buildUrl(getNormalizerBase(), '/v1/ingress/normalize-upload')}. ${hint || 'Check service connectivity in Developer Settings.'}`;
    if (step === 'price' && isNetworkError(error)) return `Could not reach quote endpoint ${buildUrl(getNormalizerBase(), '/v1/pricing/envelope-quote')}. ${hint || 'Check service connectivity in Developer Settings.'}`;
    if (step === 'commit' && isNetworkError(error)) {
      return `Could not submit signed proposal to ${buildUrl(getValidatorBase(), '/v1/propose-write')}. ${
        hint || 'Validator API unreachable from this browser session.'
      }`;
    }
    if (step === 'extract' && /415|unsupported|mime|content type/i.test(String(error?.message || error))) {
      return 'This file type is not supported for semantic extraction yet. For now, use PDF.';
    }
    if (isNetworkError(error)) return `Service connection issue. ${hint || 'Check service URLs in Developer Settings.'}`;
    return describeError(error);
  };

  const setEndpointHealth = (service, ok, detail = '') => {
    const el = service === 'validator' ? els.validatorHealth : els.normalizerHealth;
    if (!el) return;
    el.classList.remove('warn');
    if (ok) {
      el.textContent = `${service}: online`;
      return;
    }
    el.classList.add('warn');
    el.textContent = `${service}: offline${detail ? ` (${detail})` : ''}`;
  };

  const sleep = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

  const probeJson = async (url, retries = 2) => {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const res = await fetchWithRetry(url, {}, 0, 6000);
        if (!res.ok) throw new Error(`http ${res.status}`);
        return res.json();
      } catch (error) {
        lastError = error;
        if (attempt >= retries) break;
        await sleep(220 * (attempt + 1));
      }
    }
    throw lastError || new Error('endpoint probe failed');
  };

  const fetchWithRetry = async (url, init = {}, retries = 4, timeoutMs = 45000) => {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const nextInit = { ...init, signal: controller.signal };
        return await fetch(url, nextInit);
      } catch (error) {
        lastError = error;
        if (error?.name === 'AbortError') {
          lastError = new Error(`request timeout after ${Math.round(timeoutMs / 1000)}s: ${url}`);
        }
        if (attempt >= retries) break;
        await sleep(350 * (attempt + 1));
      } finally {
        window.clearTimeout(timer);
      }
    }
    throw lastError || new Error('fetch failed');
  };

  const checkEndpoints = async () => {
    if (hasHostedLocalEndpoints()) {
      setEndpointHealth('validator', false, 'localhost blocked on hosted page');
      setEndpointHealth('normalizer', false, 'localhost blocked on hosted page');
      return {
        validatorOk: false,
        normalizerOk: false,
        validatorErr: 'localhost blocked on hosted page',
        normalizerErr: 'localhost blocked on hosted page',
      };
    }

    let validatorOk = false;
    let normalizerOk = false;
    let validatorErr = '';
    let normalizerErr = '';

    try {
      await probeJson(buildUrl(getValidatorBase(), '/v1/proposals/queue/stats'));
      validatorOk = true;
    } catch (e) {
      validatorErr = String(e?.message || e);
    }

    try {
      await probeJson(buildUrl(getNormalizerBase(), '/v1/runtime-config'));
      normalizerOk = true;
    } catch (e) {
      normalizerErr = String(e?.message || e);
    }

    setEndpointHealth('validator', validatorOk, validatorErr);
    setEndpointHealth('normalizer', normalizerOk, normalizerErr);
    return {
      validatorOk,
      normalizerOk,
      validatorErr,
      normalizerErr,
    };
  };

  const ensureEndpointReadiness = async () => {
    const status = await checkEndpoints();
    if (!status.validatorOk || !status.normalizerOk) {
      const parts = [];
      if (!status.validatorOk) parts.push(`validator edge worker unreachable (${status.validatorErr || 'unknown'})`);
      if (!status.normalizerOk) parts.push(`normalizer service unreachable (${status.normalizerErr || 'unknown'})`);
      throw new Error(`Endpoint preflight failed: ${parts.join('; ')}`);
    }
  };

  const stopQueuePolling = () => {
    if (state.queuePollTimer) {
      window.clearInterval(state.queuePollTimer);
      state.queuePollTimer = null;
    }
  };

  const refreshQueueInsights = async () => {
    try {
      const res = await fetch(buildUrl(getValidatorBase(), '/v1/proposals/queue/stats'));
      if (!res.ok) return;
      const payload = await res.json();
      const root = payload?.data || payload;
      const queue = root?.batchQueueSize ?? root?.totalQueued ?? root?.queueSize ?? '0';
      const pending = root?.pendingCount ?? root?.mempoolPendingCount ?? root?.backpressurePendingCount ?? '0';
      const finalized = root?.totalFinalizedCount ?? root?.totalFinalizedCountLifetime ?? root?.processedCount ?? '0';
      els.queueDepth.textContent = String(queue);
      els.pendingCount.textContent = String(pending);
      els.finalizedCount.textContent = String(finalized);
      if (els.linkPill) els.linkPill.textContent = 'active';
    } catch (_) {
      if (els.linkPill) els.linkPill.textContent = 'degraded';
    }
  };

  const startQueuePolling = () => {
    stopQueuePolling();
    refreshQueueInsights();
    state.queuePollTimer = window.setInterval(refreshQueueInsights, 5000);
  };

  const setStep = (name, mode) => {
    const li = els.steps.querySelector(`[data-step="${name}"]`);
    if (!li) return;
    li.classList.remove('is-active', 'is-done', 'is-error');
    if (mode) li.classList.add(mode);
  };

  const clearSteps = () => {
    ['preflight', 'connect', 'register', 'extract', 'price', 'commit', 'done'].forEach((s) => setStep(s, null));
    state.stageState = {};
    renderDiagnostics();
  };

  const markActive = (name) => {
    setStep(name, 'is-active');
    state.stageState[name] = 'active';
    if (name === 'extract' || name === 'price') {
      mainEl?.classList.add('ocs-processing-lx');
    } else {
      mainEl?.classList.remove('ocs-processing-lx');
    }
    renderDiagnostics();
    updateRailSnapshot();
  };

  const markDone = (name) => {
    setStep(name, 'is-done');
    state.stageState[name] = 'done';
    if (name === 'extract' || name === 'price') {
      mainEl?.classList.remove('ocs-processing-lx');
    }
    renderDiagnostics();
    updateRailSnapshot();
  };

  const markError = (name) => {
    setStep(name, 'is-error');
    state.stageState[name] = 'error';
    if (name === 'extract' || name === 'price') {
      mainEl?.classList.remove('ocs-processing-lx');
    }
    renderDiagnostics();
    updateRailSnapshot();
  };

  const emitWalletState = () => {
    const connected = Boolean(state.connectedWallet);
    const shortAddressValue = connected ? shortAddress(state.connectedWallet) : 'not connected';
    const chainValue = state.walletChainLabel || 'unknown';
    const balanceValue = state.walletBalanceEth || '-';
    window.dispatchEvent(new CustomEvent('ocs:wallet-state', {
      detail: {
        connected,
        shortAddress: shortAddressValue,
        chain: chainValue,
        balance: balanceValue,
      },
    }));
  };

  const updateWalletPill = () => {
    if (!state.connectedWallet) {
      if (els.walletPill) {
        els.walletPill.textContent = 'Wallet not connected';
        els.walletPill.classList.add('warn');
      }
      if (els.walletAddress) els.walletAddress.textContent = 'not connected';
      if (els.walletBalance) els.walletBalance.textContent = '- ETH';
      if (els.walletChain) els.walletChain.textContent = state.walletChainLabel || 'unknown';
      if (els.connectWalletBtn) els.connectWalletBtn.textContent = 'Connect';
      if (els.clearWalletBtn) els.clearWalletBtn.classList.add('hidden');
      if (els.wallet) {
        els.wallet.readOnly = false;
        els.wallet.classList.remove('is-locked');
      }
      emitWalletState();
      updateQuoteLabelFromCurrent();
      updatePrimaryAction();
      updateRailSnapshot();
      return;
    }
    const short = `${state.connectedWallet.slice(0, 10)}...${state.connectedWallet.slice(-8)}`;
    if (els.walletPill) {
      els.walletPill.textContent = `Connected ${short}`;
      els.walletPill.classList.remove('warn');
    }
    if (els.walletAddress) els.walletAddress.textContent = shortAddress(state.connectedWallet);
    if (els.walletBalance) els.walletBalance.textContent = `${state.walletBalanceEth || '-'} ETH`;
    if (els.walletChain) els.walletChain.textContent = state.walletChainLabel || 'unknown';
    if (els.connectWalletBtn) els.connectWalletBtn.textContent = 'Refresh';
    if (els.clearWalletBtn) els.clearWalletBtn.classList.remove('hidden');
    if (els.wallet) {
      els.wallet.value = state.connectedWallet;
      els.wallet.readOnly = true;
      els.wallet.classList.add('is-locked');
    }
    emitWalletState();
    updateQuoteLabelFromCurrent();
    updatePrimaryAction();
    updateRailSnapshot();
  };

  const hydrateWalletMetrics = async () => {
    if (!state.connectedWallet) return;
    if (!window.ethereum?.request) throw new Error('MetaMask not detected');
    try {
      const [chainId, balanceWei] = await Promise.all([
        window.ethereum.request({ method: 'eth_chainId' }),
        window.ethereum.request({ method: 'eth_getBalance', params: [state.connectedWallet, 'latest'] }),
      ]);
      state.walletChainId = chainId;
      state.walletChainLabel = chainLabelFromId(chainId);
      state.walletBalanceEth = formatWeiToEth(balanceWei);
      updateWalletPill();
    } catch (_e) {
      state.walletChainId = null;
      state.walletChainLabel = 'Unknown';
      state.walletBalanceEth = null;
      updateWalletPill();
    }
  };

  const updateFilePill = () => {
    if (!state.selectedFile) {
      els.filePill.textContent = 'No file selected';
      resetPreparedDraft();
      updateQuoteLabelFromCurrent();
      updatePrimaryAction();
      updateRailSnapshot();
      return;
    }
    const mb = (state.selectedFile.size / (1024 * 1024)).toFixed(2);
    els.filePill.textContent = `${state.selectedFile.name} (${mb} MB)`;
    resetPreparedDraft();
    updateQuoteLabelFromCurrent();
    updatePrimaryAction();
    updateRailSnapshot();
  };

  const updatePrimaryAction = () => {
    if (state.busy) return;
    if (!state.selectedFile) {
      els.writeBtn.disabled = true;
      els.writeBtn.textContent = 'Add content to begin';
      els.writeBtn.classList.remove('is-propose-ready');
      return;
    }
    if (!state.connectedWallet) {
      els.writeBtn.disabled = false;
      els.writeBtn.textContent = 'Connect Wallet';
      els.writeBtn.classList.remove('is-propose-ready');
      return;
    }
    const proposeReady = isPreparedDraftCurrent();
    els.writeBtn.disabled = false;
    els.writeBtn.textContent = proposeReady ? 'I Wish to Propose This' : 'Estimate Proposal Cost';
    els.writeBtn.classList.toggle('is-propose-ready', proposeReady);
  };

  const getPaymentRecipient = () => {
    const override = (els.paymentRecipientOverride.value || '').trim();
    return override || state.discoveredPaymentTarget;
  };

  const resolveWallet = () => {
    if (!state.connectedWallet) {
      throw new Error('Connect MetaMask wallet first.');
    }
    const candidate = normalizeAddress(state.connectedWallet);
    if (!isValidAddress(candidate)) {
      throw new Error('Connected MetaMask wallet address is invalid.');
    }
    els.wallet.value = candidate;
    state.connectedWallet = candidate;
    return candidate;
  };

  const ensureWalletOnExpectedNetwork = async () => {
    if (!window.ethereum?.request) throw new Error('MetaMask not detected');
    if (!state.expectedChainId) return;

    const expected = normalizeChainId(state.expectedChainId);
    const current = normalizeChainId(await window.ethereum.request({ method: 'eth_chainId' }));
    if (expected && current === expected) return;

    const expectedName = chainNameForId(expected);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expected }],
      });
      await hydrateWalletMetrics();
      appendFeed(`wallet switched to ${expectedName}`, 'ok');
      return;
    } catch (switchError) {
      if (switchError?.code === 4902 && expected === '0xaa36a7') {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
        await hydrateWalletMetrics();
        appendFeed('wallet switched to Sepolia', 'ok');
        return;
      }
      if (switchError?.code === 4001) {
        throw new Error(`Switch wallet to ${expectedName} to continue.`);
      }
      throw new Error(`Wallet network mismatch. Expected ${expectedName}.`);
    }
  };

  const discoverPaymentTarget = async () => {
    if (hasHostedLocalEndpoints()) {
      state.blockchainConfig = null;
      state.expectedChainId = null;
      state.discoveredPaymentTarget = null;
      if (els.networkPill) els.networkPill.textContent = 'offline';
      if (els.linkPill) els.linkPill.textContent = 'degraded';
      return;
    }

    const override = (els.paymentRecipientOverride.value || '').trim();
    if (override) {
      state.discoveredPaymentTarget = override;
      return;
    }

    try {
      const res = await fetch(`${getValidatorBase()}/v1/blockchain/config`);
      if (!res.ok) throw new Error(`config ${res.status}`);
      const payload = await res.json();
      const root = payload?.data || payload?.config || payload;
      state.blockchainConfig = root;
      const net = inferNetworkName(root);
      state.expectedChainId = expectedChainIdForNetwork(net);
      if (els.networkPill) els.networkPill.textContent = net === 'unknown' ? 'unknown network' : net;
      const candidatePairs = [
        root?.paymentRecipient,
        root?.clusterWalletAddress,
        root?.walletAddress,
        root?.contractAddress,
      ];
      const hit = candidatePairs.find((value) => value && String(value).startsWith('0x'));
      state.discoveredPaymentTarget = hit || null;
      if (els.linkPill) els.linkPill.textContent = hit ? 'active' : 'partial';
    } catch (e) {
      state.blockchainConfig = null;
      state.expectedChainId = null;
      state.discoveredPaymentTarget = null;
      if (els.networkPill) els.networkPill.textContent = 'offline';
      if (els.linkPill) els.linkPill.textContent = 'offline';
    }
  };

  const loadRuntimeConfig = async () => {
    if (hasHostedLocalEndpoints()) {
      const hint = endpointHint();
      setStatus(hint || 'Service endpoints unavailable from hosted page.');
      if (els.networkPill) els.networkPill.textContent = 'offline';
      if (els.linkPill) els.linkPill.textContent = 'degraded';
      setEndpointHealth('validator', false, 'localhost blocked on hosted page');
      setEndpointHealth('normalizer', false, 'localhost blocked on hosted page');
      stopQueuePolling();
      appendFeed('runtime probes skipped (hosted page + localhost endpoints)', 'warn');
      return;
    }

    let runtimeAvailable = true;
    try {
      const res = await fetch(`${getNormalizerBase()}/v1/runtime-config`);
      if (res.ok) state.runtimeConfig = await res.json();
      state.runtimeConfig.mockWalletFlow = false;
    } catch (e) {
      runtimeAvailable = false;
      const hint = endpointHint();
      setStatus(hint ? `Service unavailable. ${hint}` : 'Service unavailable. Check API URL in Developer Settings.');
      appendFeed('runtime unavailable', 'warn');
    }
    await checkEndpoints();
    await discoverPaymentTarget();
    if (runtimeAvailable) {
      const chainMode = inferNetworkName(state.blockchainConfig || {});
      const chainLabel = chainMode === 'unknown' ? 'chain unknown' : `chain ${chainMode}`;
      setStatus(`Ready (normalizer ${state.runtimeConfig.normalizerMode}, ${chainLabel}, MetaMask signing)`);
      appendFeed(`runtime normalizer=${state.runtimeConfig.normalizerMode}, ${chainLabel}`, 'info');
    }
    if (state.connectedWallet) await hydrateWalletMetrics();
    startQueuePolling();
  };

  const connectWallet = async ({ interactive = true } = {}) => {
    const bridge = window.__ocsWalletBridge;
    if (bridge?.connect) {
      const detail = await bridge.connect(interactive);
      if (!detail?.connected) {
        if (!interactive) return false;
        throw new Error('No wallet account available');
      }
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts?.length) {
        if (!interactive) return false;
        throw new Error('No wallet account available');
      }
      [state.connectedWallet] = accounts;
      state.connectedWallet = normalizeAddress(state.connectedWallet);
      if (!isValidAddress(state.connectedWallet)) throw new Error('Connected wallet address is invalid.');
      state.walletProvider = 'metamask';
      els.wallet.value = state.connectedWallet;
      await ensureWalletOnExpectedNetwork();
      await hydrateWalletMetrics();
      updateWalletPill();
      appendFeed(interactive ? 'wallet connected' : 'wallet session restored', 'ok');
      return true;
    }

    if (!window.ethereum) {
      if (interactive) showWalletHelpModal();
      throw new Error('No wallet provider detected. Install MetaMask or another EVM wallet.');
    }
    if (interactive) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permissionError) {
        if (permissionError?.code === 4001) throw new Error('Wallet connection rejected');
      }
    }
    const accounts = await window.ethereum.request({ method: interactive ? 'eth_requestAccounts' : 'eth_accounts' });
    if (!accounts || !accounts.length) {
      if (!interactive) return false;
      throw new Error('No wallet account available');
    }
    [state.connectedWallet] = accounts;
    state.connectedWallet = normalizeAddress(state.connectedWallet);
    if (!isValidAddress(state.connectedWallet)) throw new Error('Connected wallet address is invalid.');
    state.walletProvider = 'metamask';
    els.wallet.value = state.connectedWallet;
    await ensureWalletOnExpectedNetwork();
    await hydrateWalletMetrics();
    updateWalletPill();
    appendFeed(interactive ? 'wallet connected' : 'wallet session restored', 'ok');
    return true;
  };

  const clearWalletSession = () => {
    state.connectedWallet = null;
    state.walletBalanceEth = null;
    state.walletChainId = null;
    state.walletChainLabel = 'unknown';
    state.walletProvider = null;
    state.isRegistered = false;
    resetPreparedDraft();
    updateQuoteLabelFromCurrent();
    updateWalletPill();
    appendFeed('wallet session cleared', 'warn');
  };

  const ensureRegistration = async () => {
    if (state.isRegistered) return;
    const wallet = resolveWallet();

    const clientId = `oak-supply-chain-${wallet.slice(2, 10)}`;
    const form = new URLSearchParams({
      walletAddress: wallet,
      clientId,
      clientUrl: window.location.origin,
    });

    let res;
    try {
      res = await fetchWithRetry(`${getValidatorBase()}/v1/register-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    } catch (error) {
      throw new Error(formatFlowError('register', error));
    }

    const raw = await res.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { raw };
    }
    setDev({ stage: 'register-client', status: res.status, response: payload });

    if (!res.ok) {
      throw new Error(payload?.error || payload?.message || `register failed (${res.status})`);
    }
    state.isRegistered = true;
    appendFeed('write session prepared', 'ok');
  };

  const getQuote = async (sizeBytes) => {
    const intent = INTENTS[state.selectedIntent];
    const wallet = resolveWallet();
    const body = {
      wallet,
      organization: els.org.value,
      depth: intent.depth,
      schemaId: 'schema:doc-envelope',
      schemaVersion: '1.0.0',
      estimatedBytes: sizeBytes,
    };

    const res = await fetchWithRetry(`${getNormalizerBase()}/v1/pricing/envelope-quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`quote failed ${res.status}`);
    state.latestQuote = await res.json();
    updateQuoteLabelFromCurrent();
    return state.latestQuote;
  };

  const getQuotePreview = async () => {
    if (!state.selectedFile) {
      els.quoteLabel.textContent = 'Add file to estimate';
      return;
    }
    if (!state.connectedWallet) {
      els.quoteLabel.textContent = 'Connect wallet to estimate proposal';
      return;
    }

    try {
      await getQuote(state.selectedFile.size);
      appendFeed('cost estimated', 'ok');
    } catch (error) {
      els.quoteLabel.textContent = 'Estimate unavailable';
      appendFeed('cost estimate unavailable', 'warn');
    }
  };

  const normalizeAndMap = async () => {
    const startedAt = Date.now();
    const intent = INTENTS[state.selectedIntent];
    const wallet = resolveWallet();
    const form = new FormData();
    form.append('file', state.selectedFile);
    form.append('wallet', wallet);
    form.append('organization', els.org.value);
    form.append('depth', intent.depth);
    form.append('promptProfile', intent.promptProfile);
    form.append('schemaId', 'schema:doc-envelope');
    form.append('schemaVersion', '1.0.0');
    const uploadCidMode = state.ipfsMode === 'client' ? 'client' : 'validator';
    form.append('cidMode', uploadCidMode);
    if (uploadCidMode === 'client') {
      const stagedCid = (els.clientIpfsCid?.value || '').trim();
      if (stagedCid) form.append('sourceCid', stagedCid);
    }

    try {
      setDev({
        stage: 'normalize-upload:start',
        endpoint: `${getNormalizerBase()}/v1/ingress/normalize-upload`,
        file: state.selectedFile?.name || null,
        fileSizeBytes: state.selectedFile?.size || null,
        startedAt: new Date(startedAt).toISOString(),
      });
      const uploadStarted = Date.now();
      const res = await fetchWithRetry(`${getNormalizerBase()}/v1/ingress/normalize-upload`, {
        method: 'POST',
        body: form,
      }, 0, 240000);
      const uploadElapsedMs = Date.now() - uploadStarted;
      if (!res.ok) throw new Error(`normalize failed ${res.status}: ${await res.text()}`);

      const normalized = await res.json();
      state.latestEnvelope = normalized.envelopeDraft;
      state.latestNormalization = normalized;
      renderEnvelopePreview();
      const extractionSummary = summarizeExtractions(normalized);
      if (extractionSummary.total > 0) {
        appendFeed(
          `ingest extraction confidence ${normalized.confidence} | ${extractionSummary.total} entities (${extractionSummary.classes.join(', ')})`,
          'ok',
        );
      } else {
        appendFeed(`ingest extraction returned no entities (confidence ${normalized.confidence})`, 'warn');
      }

      setDev({
        stage: 'normalize-upload:done',
        uploadElapsedMs,
        confidence: normalized.confidence,
        extractionCount: extractionSummary.total,
      });

      const jcrStarted = Date.now();
      const jcrRes = await fetchWithRetry(`${getNormalizerBase()}/v1/envelopes/jcr-map`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ envelope: normalized.envelopeDraft }),
      }, 2, 30000);
      const jcrElapsedMs = Date.now() - jcrStarted;
      if (!jcrRes.ok) throw new Error(`jcr map failed ${jcrRes.status}`);
      const jcrMap = await jcrRes.json();

      setDev({ stage: 'normalize-map:done', uploadElapsedMs, jcrElapsedMs, normalized, jcrMap });
      return normalized;
    } catch (error) {
      setDev({
        stage: 'normalize-map:error',
        message: describeError(error),
        endpointUpload: `${getNormalizerBase()}/v1/ingress/normalize-upload`,
        endpointJcrMap: `${getNormalizerBase()}/v1/envelopes/jcr-map`,
      });
      throw error;
    }
  };

  const submitWrite = async () => {
    if (!window.ethereum) throw new Error('MetaMask not detected');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts.length) throw new Error('No wallet account available');
    let [wallet] = accounts;
    wallet = normalizeAddress(wallet);
    if (!isValidAddress(wallet)) throw new Error('Connected wallet address is invalid.');
    els.wallet.value = wallet;
    state.connectedWallet = wallet;
    let paymentTx;
    let signature;
    const proposalId = generateProposalIdHex();
    state.ipfsMode = (els.ipfsMode?.value || 'validator').trim().toLowerCase() === 'client' ? 'client' : 'validator';

    const paymentRecipient = getPaymentRecipient();
    if (!paymentRecipient || !paymentRecipient.startsWith('0x')) {
      throw new Error('Payment recipient unavailable. Set override in Developer Settings.');
    }

    const paymentValueHex = toHexQuantity(state.latestQuote.totalFeeWei);
    const transferDraft = {
      from: wallet,
      to: paymentRecipient,
      value: paymentValueHex,
    };

    // Avoid wallet/provider defaults exceeding local chain gas caps.
    const MAX_TX_GAS = 16777215n;
    let txGas = 21000n;
    try {
      const estimated = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [transferDraft],
      });
      const estimate = BigInt(String(estimated || '0x5208'));
      const buffered = (estimate * 12n) / 10n;
      txGas = buffered > MAX_TX_GAS ? MAX_TX_GAS : buffered;
      if (txGas < 21000n) txGas = 21000n;
    } catch (_estimateError) {
      txGas = 21000n;
    }

    paymentTx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ ...transferDraft, gas: toHexQuantity(txGas) }],
    });

    const message = JSON.stringify({
      proposalId,
      ipfsMode: state.ipfsMode,
      clientCid: state.ipfsMode === 'client' ? (els.clientIpfsCid?.value || '').trim() : null,
      envelope: state.latestEnvelope,
      quoteId: state.latestQuote.quoteId,
      paymentTier: state.ipfsMode === 'validator' ? 'priority' : 'standard',
      timestamp: Date.now(),
      mode: 'live',
    });
    signature = await window.ethereum.request({ method: 'personal_sign', params: [message, wallet] });
    const selectedClientCid = (els.clientIpfsCid?.value || '').trim();
    let body;
    let headers = {};
    if (state.ipfsMode === 'client') {
      if (!isLikelyIpfsCid(selectedClientCid)) {
        throw new Error('Client CID mode requires a valid IPFS CID (Qm... or bafy...).');
      }
      const form = new URLSearchParams({
        walletAddress: wallet,
        message,
        contentType: 'envelope',
        paymentTier: 'standard',
        ethereumTxHash: paymentTx,
        proposalId,
        ipfsCid: selectedClientCid,
        signature,
      });
      body = form.toString();
      headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    } else {
      if (!state.selectedFile) {
        throw new Error('Validator binary mode requires a file to upload.');
      }
      const formData = new FormData();
      formData.append('file', state.selectedFile, state.selectedFile.name || 'artifact.bin');
      formData.append('walletAddress', wallet);
      formData.append('message', message);
      formData.append('contentType', 'envelope');
      formData.append('paymentTier', 'priority');
      formData.append('ethereumTxHash', paymentTx);
      formData.append('proposalId', proposalId);
      formData.append('signature', signature);
      body = formData;
    }

    const proposeUrl = `${getValidatorBase()}/v1/propose-write`;
    const fallbackBase = (state.blockchainConfig?.validatorUrl || '').replace(/\/+$/, '');
    const fallbackUrl = fallbackBase ? `${fallbackBase}/v1/propose-write` : '';
    const candidates = [proposeUrl, fallbackUrl].filter((url, index, list) => url && list.indexOf(url) === index);
    let res;
    let lastNetworkError = null;
    let activeCandidate = proposeUrl;
    for (let i = 0; i < candidates.length; i += 1) {
      activeCandidate = candidates[i];
      try {
        res = await fetchWithRetry(activeCandidate, {
          method: 'POST',
          headers,
          body,
        }, 2);
        break;
      } catch (error) {
        lastNetworkError = error;
      }
    }
    if (!res) {
      setDev({
        stage: 'propose-write-network-failure',
        validatorUrl: proposeUrl,
        fallbackValidatorUrl: fallbackUrl || null,
        submittedProposalId: proposalId,
        ethereumTxHash: paymentTx,
        error: describeError(lastNetworkError),
      });
      throw new Error(`Proposal submission network failure after wallet tx ${paymentTx}: ${describeError(lastNetworkError)}`);
    }

    const raw = await res.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { raw };
    }

    const detail = {
      stage: 'propose-write',
      ok: res.ok,
      status: res.status,
      proposalId: payload?.proposalId || payload?.data?.proposalId || payload?.id || proposalId,
      submittedProposalId: proposalId,
      ipfsMode: state.ipfsMode,
      submittedIpfsCid: state.ipfsMode === 'client' ? selectedClientCid : null,
      validatorUrl: activeCandidate,
      paymentRecipient,
      ethereumTxHash: paymentTx,
      signature,
      response: payload,
    };
    setDev(detail);

    if (!res.ok) throw new Error(describePayloadError(payload, `validator rejected proposal (${res.status})`));

    if (detail.proposalId && detail.proposalId !== proposalId) {
      appendFeed(`proposal accepted with remapped id ${detail.proposalId}`, 'warn');
    } else {
      appendFeed(`proposal accepted ${detail.proposalId || proposalId}`.trim(), 'ok');
    }
    return detail;
  };

  const stopStatusPolling = () => {
    if (state.statusPollTimer) {
      window.clearInterval(state.statusPollTimer);
      state.statusPollTimer = null;
    }
  };

  const startStatusPolling = (proposalId) => {
    stopStatusPolling();
    if (!proposalId) return;
    const statusUrl = buildUrl(getValidatorBase(), `/v1/proposals/${proposalId}/status`);
    let attempts = 0;
    state.statusPollTimer = window.setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(statusUrl);
        if (!res.ok) return;
        const payload = await res.json();
        const root = payload?.data || payload;
        const phase = root?.status || root?.state || 'processing';
        els.writeState.textContent = `Write status: ${phase}`;
        appendFeed(`status ${phase}`, /final|committed|done|complete/i.test(String(phase)) ? 'ok' : 'info');
        if (/final|committed|done|complete/i.test(String(phase))) {
          stopStatusPolling();
        }
      } catch (_) {
        // keep prior state text
      }
      if (attempts >= 20) stopStatusPolling();
    }, 3000);
  };

  const writeFlow = async () => {
    if (state.busy) return;
    setStageEngaged();
    if (!state.selectedFile) {
      setStatus('Add a file first');
      return;
    }

    if (!state.connectedWallet) {
      try {
        await connectWallet();
      } catch (e) {
        setStatus(formatFlowError('connect', e));
        appendFeed(`wallet error: ${formatFlowError('connect', e)}`, 'error');
        return;
      }
    }

    const prepared = isPreparedDraftCurrent();
    clearSteps();
    state.lastFlowError = '';
    state.lastFailedStep = '';
    renderDiagnostics();
    setBusy(true);
    if (!prepared) revealPrimaryPanels();
    setStatus(prepared ? 'Submitting signed proposal...' : 'Preparing proposal estimate...');
    appendFeed(prepared ? 'proposal signing flow started' : 'proposal estimate flow started', 'info');

    try {
      markActive('preflight');
      await ensureEndpointReadiness();
      markDone('preflight');

      markActive('connect');
      await ensureWalletOnExpectedNetwork();
      markDone('connect');

      markActive('register');
      await discoverPaymentTarget();
      await ensureRegistration();
      markDone('register');

      let normalized = null;
      if (!prepared) {
        markActive('extract');
        normalized = await normalizeAndMap();
        revealPrimaryPanels();
        markDone('extract');

        markActive('price');
        await getQuote(normalized.fileInfo.sizeBytes);
        markDone('price');

        state.preparedDraftKey = currentDraftKey();
        setStatus('Estimate ready. Review cost, then click "I Wish to Propose This".');
        appendFeed('proposal estimate ready; awaiting signature', 'ok');
        return;
      }

      markDone('extract');
      markDone('price');
      markActive('commit');
      const result = await submitWrite();
      markDone('commit');

      markActive('done');
      markDone('done');
      state.lastFlowError = '';
      state.lastFailedStep = '';
      renderDiagnostics();
      els.successCard.classList.remove('hidden');
      els.contentCid.textContent = state.latestEnvelope?.source?.contentCid || '-';
      els.txHash.textContent = result?.ethereumTxHash || '-';
      const network = inferNetworkName(state.blockchainConfig);
      const txUrl = etherscanTxUrl(network, result?.ethereumTxHash);
      if (txUrl) {
        els.txLink.href = txUrl;
        els.txLink.textContent = network === 'sepolia' ? 'View transaction (Sepolia Etherscan)' : 'View transaction (Etherscan)';
        els.txLink.classList.remove('is-disabled');
      } else {
        els.txLink.removeAttribute('href');
        els.txLink.textContent = 'View transaction';
        els.txLink.classList.add('is-disabled');
      }
      const proposalStatusUrl = result?.proposalId
        ? buildUrl(getValidatorBase(), `/v1/proposals/${result.proposalId}/status`)
        : buildUrl(getValidatorBase(), '/v1/proposals/queue/stats');
      els.statusLink.href = proposalStatusUrl;
      els.statusLink.textContent = result?.proposalId ? 'Track write status' : 'View queue insights';
      els.writeState.textContent = result?.proposalId ? `Write accepted. Proposal ID: ${result.proposalId}` : 'Write accepted. Tracking by queue insights.';
      startStatusPolling(result?.proposalId);
      setStatus('Proposal committed to the distributed fabric');
      appendFeed('content committed and receipted', 'ok');
      resetPreparedDraft();
      updateQuoteLabelFromCurrent();
    } catch (e) {
      stopStatusPolling();
      const active = els.steps.querySelector('.is-active');
      const activeStep = active ? active.getAttribute('data-step') : '';
      if (active) {
        markError(activeStep);
      }
      const rendered = formatFlowError(activeStep, e);
      state.lastFlowError = rendered;
      state.lastFailedStep = activeStep || '';
      renderDiagnostics();
      setStatus(rendered);
      appendFeed(`flow error: ${rendered}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const setIntent = (intent) => {
    setStageEngaged();
    state.selectedIntent = intent;
    const cfg = INTENTS[intent];
    els.intentSummary.textContent = cfg.summary;
    if (els.intentEta) els.intentEta.textContent = cfg.eta;
    root.querySelectorAll('.ocs-intent-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-intent') === intent);
    });
    resetPreparedDraft();
    updateQuoteLabelFromCurrent();
    updatePrimaryAction();
    updateRailSnapshot();
  };

  const setFile = (file) => {
    setStageEngaged();
    state.selectedFile = file;
    updateFilePill();
    updatePrimaryAction();
  };

  els.drop.addEventListener('click', (event) => {
    setStageEngaged();
    if (event.target === els.file) return;
    try {
      if (typeof els.file.showPicker === 'function') {
        els.file.showPicker();
      } else {
        els.file.click();
      }
    } catch (_) {
      els.file.click();
    }
  });
  els.drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.drop.classList.add('is-drag');
  });
  els.drop.addEventListener('dragleave', () => {
    els.drop.classList.remove('is-drag');
  });
  els.drop.addEventListener('drop', (e) => {
    e.preventDefault();
    setStageEngaged();
    els.drop.classList.remove('is-drag');
    const [file] = e.dataTransfer.files;
    setFile(file || null);
  });

  els.file.addEventListener('change', () => {
    setFile(els.file.files[0] || null);
  });

  els.writeBtn.addEventListener('click', writeFlow);
  if (els.connectWalletBtn) {
    els.connectWalletBtn.addEventListener('click', async () => {
      setStageEngaged();
      try {
        await connectWallet({ interactive: true });
        setStatus('Wallet connected');
        updateQuoteLabelFromCurrent();
      } catch (e) {
        setStatus(formatFlowError('connect', e));
        appendFeed(`wallet error: ${formatFlowError('connect', e)}`, 'error');
      }
    });
  }
  if (els.clearWalletBtn) els.clearWalletBtn.addEventListener('click', clearWalletSession);
  window.addEventListener('ocs:wallet-connect-request', async () => {
    setStageEngaged();
    try {
      await connectWallet({ interactive: true });
      setStatus('Wallet connected');
      updateQuoteLabelFromCurrent();
    } catch (e) {
      setStatus(formatFlowError('connect', e));
      appendFeed(`wallet error: ${formatFlowError('connect', e)}`, 'error');
    }
  });
  window.addEventListener('ocs:wallet-clear-request', () => {
    clearWalletSession();
  });

  root.querySelectorAll('.ocs-intent-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setIntent(btn.getAttribute('data-intent'));
    });
  });

  if (els.envelopeApplyBtn) {
    els.envelopeApplyBtn.addEventListener('click', applyEnvelopeSafeEdits);
  }
  if (els.envelopeResetBtn) {
    els.envelopeResetBtn.addEventListener('click', () => {
      syncEnvelopeEditor(true);
      setEnvelopeEditStatus('Safe fields reset to current envelope values.');
    });
  }
  [els.envelopeEditTitle, els.envelopeEditSummary, els.envelopeEditSourceUri, els.envelopeEditLanguage]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener('input', markEnvelopeEditsDirty);
    });

  [els.validatorUrl, els.normalizerUrl, els.paymentRecipientOverride].filter(Boolean).forEach((input) => {
    input.addEventListener('change', async () => {
      stopStatusPolling();
      stopQueuePolling();
      await loadRuntimeConfig();
      await getQuotePreview();
    });
  });

  if (els.ipfsMode) {
    els.ipfsMode.addEventListener('change', () => {
      state.ipfsMode = (els.ipfsMode.value || 'validator').trim().toLowerCase() === 'client' ? 'client' : 'validator';
      resetPreparedDraft();
      updateQuoteLabelFromCurrent();
      updateRailSnapshot();
    });
  }

  if (window.ethereum?.on) {
    window.ethereum.on('accountsChanged', async (accounts) => {
      const [next] = accounts || [];
      if (!next) {
        clearWalletSession();
        return;
      }
      const normalized = normalizeAddress(next);
      if (!isValidAddress(normalized)) return;
      if (normalized.toLowerCase() === String(state.connectedWallet || '').toLowerCase()) return;
      state.connectedWallet = normalized;
      state.isRegistered = false;
      resetPreparedDraft();
      await hydrateWalletMetrics();
      updateWalletPill();
      appendFeed('wallet account changed', 'warn');
      updateQuoteLabelFromCurrent();
    });
    window.ethereum.on('chainChanged', async (chainId) => {
      state.walletChainId = chainId;
      state.walletChainLabel = chainLabelFromId(chainId);
      resetPreparedDraft();
      await hydrateWalletMetrics();
      updateWalletPill();
      appendFeed(`network changed to ${state.walletChainLabel}`, 'warn');
      const expected = normalizeChainId(state.expectedChainId);
      const current = normalizeChainId(chainId);
      if (expected && current && expected !== current) {
        setStatus(`Wallet is on ${chainNameForId(current)}. Switch to ${chainNameForId(expected)}.`);
        appendFeed(`wallet chain mismatch (expected ${chainNameForId(expected)})`, 'error');
      }
    });
  }

  clearSteps();
  updateWalletPill();
  updateFilePill();
  setIntent(state.selectedIntent);
  updatePrimaryAction();
  updateQuoteLabelFromCurrent();
  syncEnvelopeEditor(true);
  updateRailSnapshot();
  loadRuntimeConfig();
  window.addEventListener('beforeunload', (event) => {
    if (!state.busy) return;
    event.preventDefault();
    event.returnValue = '';
  });
  (async () => {
    try {
      const restored = await connectWallet({ interactive: false });
      if (restored) {
        updateQuoteLabelFromCurrent();
        setStatus('Wallet restored from MetaMask session');
      }
    } catch (_e) {
      // Keep disconnected state when wallet is unavailable/unauthorized.
    }
  })();
  if (mainEl?.dataset) mainEl.dataset.ocsRuntimeBooted = 'true';
  return true;
}

export default function decorate(block) {
  block.textContent = '';
  block.innerHTML = template();
  bootContentSupplyChainRuntime(block);
}
