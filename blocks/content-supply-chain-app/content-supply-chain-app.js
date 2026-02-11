function randomHex(bytes = 32) {
  let out = '0x';
  for (let i = 0; i < bytes; i += 1) out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return out;
}

function pretty(data) {
  return JSON.stringify(data, null, 2);
}

function template() {
  return `
    <section class="ocs-shell">
      <header class="ocs-hero">
        <p class="ocs-kicker">Oak Content Supply Chain</p>
        <h2>Drop content. Write once. Move on.</h2>
        <p class="ocs-subtitle">Connect your wallet, add a document, and let Oak handle provenance, envelopeing, and network commit in one polished flow.</p>
      </header>

      <div class="ocs-grid">
        <section class="ocs-card ocs-connect">
          <h3>1) Connect</h3>
          <p class="ocs-muted">Use your wallet to establish ownership and write rights.</p>
          <button data-el="connectBtn" class="ocs-btn">Connect Wallet</button>
          <p data-el="walletPill" class="ocs-pill warn">Not connected</p>
        </section>

        <section class="ocs-card ocs-ingest">
          <h3>2) Add Content</h3>
          <div data-el="drop" class="ocs-dropzone">
            <input data-el="file" type="file" accept="application/pdf" class="ocs-file-input" />
            <p class="ocs-drop-title">Drag PDF here</p>
            <p class="ocs-drop-sub">or click to browse</p>
          </div>
          <p data-el="filePill" class="ocs-pill">No file selected</p>

          <label class="ocs-label" for="ocs-intent">Extraction Intent</label>
          <div id="ocs-intent" class="ocs-intent">
            <button type="button" data-intent="quick" class="ocs-intent-btn">Quick</button>
            <button type="button" data-intent="balanced" class="ocs-intent-btn is-active">Balanced</button>
            <button type="button" data-intent="deep" class="ocs-intent-btn">Deep</button>
          </div>
          <p class="ocs-muted" data-el="intentSummary">Balanced depth with strong metadata and hierarchy extraction.</p>
        </section>

        <section class="ocs-card ocs-commit">
          <h3>3) Write to Oak</h3>
          <p class="ocs-muted">One action performs pricing, payment authorization, envelope write, and network commit.</p>
          <div class="ocs-quote">
            <span>Estimated Cost</span>
            <strong data-el="quoteLabel">Not estimated yet</strong>
          </div>
          <button data-el="writeBtn" class="ocs-btn ocs-btn-primary">Write to Oak</button>
          <p data-el="status" class="ocs-status">Ready</p>
        </section>
      </div>

      <section class="ocs-card ocs-progress">
        <h3>Flow</h3>
        <ol data-el="steps" class="ocs-steps">
          <li data-step="connect">Connect wallet</li>
          <li data-step="register">Prepare workspace</li>
          <li data-step="extract">Extract and envelope</li>
          <li data-step="price">Calculate cost</li>
          <li data-step="commit">Commit write</li>
          <li data-step="done">Done</li>
        </ol>
      </section>

      <section data-el="successCard" class="ocs-card ocs-success hidden">
        <h3>Write Complete</h3>
        <p class="ocs-muted">Your content is now committed with provenance. Downstream SEE consumers can react to this write event.</p>
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

      <details class="ocs-dev">
        <summary>Developer Settings</summary>
        <div class="ocs-dev-grid">
          <label>Wallet Override
            <input data-el="wallet" value="0x742d35Cc6634c0532925a3b844bc9e7595f0beb" />
          </label>
          <label>Organization
            <input data-el="org" value="example-org" />
          </label>
          <label>Validator URL
            <input data-el="validatorUrl" value="http://127.0.0.1:8090" />
          </label>
          <label>Normalizer API URL
            <input data-el="normalizerUrl" value="http://127.0.0.1:8088" />
          </label>
          <label>Payment Recipient Override
            <input data-el="paymentRecipientOverride" placeholder="optional 0x..." />
          </label>
        </div>
        <pre data-el="devOut">{"status":"dev-idle"}</pre>
      </details>
    </section>
  `;
}

const INTENTS = {
  quick: {
    depth: 'L1',
    promptProfile: 'metadata-quick',
    summary: 'Fast pass for minimal metadata and ownership envelopeing.',
  },
  balanced: {
    depth: 'L2',
    promptProfile: 'assets-metadata-hierarchy',
    summary: 'Balanced depth with strong metadata and hierarchy extraction.',
  },
  deep: {
    depth: 'L3',
    promptProfile: 'deep-graph-analysis',
    summary: 'Deep extraction for richer contextual graph data.',
  },
};

export default function decorate(block) {
  block.textContent = '';
  block.innerHTML = template();

  const state = {
    selectedFile: null,
    connectedWallet: null,
    runtimeConfig: { normalizerMode: 'mock', mockWalletFlow: true },
    isRegistered: false,
    discoveredPaymentTarget: null,
    latestEnvelope: null,
    latestQuote: null,
    selectedIntent: 'balanced',
    busy: false,
  };

  const q = (name) => block.querySelector(`[data-el="${name}"]`);
  const els = {
    connectBtn: q('connectBtn'),
    writeBtn: q('writeBtn'),
    walletPill: q('walletPill'),
    filePill: q('filePill'),
    status: q('status'),
    drop: q('drop'),
    file: q('file'),
    steps: q('steps'),
    quoteLabel: q('quoteLabel'),
    successCard: q('successCard'),
    contentCid: q('contentCid'),
    txHash: q('txHash'),
    intentSummary: q('intentSummary'),
    devOut: q('devOut'),
    wallet: q('wallet'),
    org: q('org'),
    validatorUrl: q('validatorUrl'),
    normalizerUrl: q('normalizerUrl'),
    paymentRecipientOverride: q('paymentRecipientOverride'),
  };

  const setStatus = (msg) => {
    els.status.textContent = msg;
  };

  const setDev = (data) => {
    els.devOut.textContent = pretty(data);
  };

  const setBusy = (flag) => {
    state.busy = flag;
    els.writeBtn.disabled = flag;
    els.connectBtn.disabled = flag;
  };

  const getNormalizerBase = () => (els.normalizerUrl.value || '').replace(/\/+$/, '');
  const getValidatorBase = () => (els.validatorUrl.value || '').replace(/\/+$/, '');

  const setStep = (name, mode) => {
    const li = els.steps.querySelector(`[data-step="${name}"]`);
    if (!li) return;
    li.classList.remove('is-active', 'is-done', 'is-error');
    if (mode) li.classList.add(mode);
  };

  const clearSteps = () => {
    ['connect', 'register', 'extract', 'price', 'commit', 'done'].forEach((s) => setStep(s, null));
  };

  const markActive = (name) => {
    setStep(name, 'is-active');
  };

  const markDone = (name) => {
    setStep(name, 'is-done');
  };

  const markError = (name) => {
    setStep(name, 'is-error');
  };

  const updateWalletPill = () => {
    if (!state.connectedWallet) {
      els.walletPill.textContent = 'Not connected';
      els.walletPill.classList.add('warn');
      return;
    }
    const short = `${state.connectedWallet.slice(0, 10)}...${state.connectedWallet.slice(-8)}`;
    els.walletPill.textContent = `Connected ${short}`;
    els.walletPill.classList.remove('warn');
  };

  const updateFilePill = () => {
    if (!state.selectedFile) {
      els.filePill.textContent = 'No file selected';
      return;
    }
    const mb = (state.selectedFile.size / (1024 * 1024)).toFixed(2);
    els.filePill.textContent = `${state.selectedFile.name} (${mb} MB)`;
  };

  const getPaymentRecipient = () => {
    const override = (els.paymentRecipientOverride.value || '').trim();
    return override || state.discoveredPaymentTarget;
  };

  const discoverPaymentTarget = async () => {
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
      const candidatePairs = [
        root?.paymentRecipient,
        root?.clusterWalletAddress,
        root?.walletAddress,
        root?.contractAddress,
      ];
      const hit = candidatePairs.find((value) => value && String(value).startsWith('0x'));
      state.discoveredPaymentTarget = hit || null;
    } catch (e) {
      state.discoveredPaymentTarget = null;
    }
  };

  const loadRuntimeConfig = async () => {
    try {
      const res = await fetch(`${getNormalizerBase()}/v1/runtime-config`);
      if (res.ok) state.runtimeConfig = await res.json();
      setStatus(`Ready (${state.runtimeConfig.normalizerMode} mode)`);
    } catch (e) {
      setStatus('Service unavailable. Check API URL in Developer Settings.');
    }
    await discoverPaymentTarget();
  };

  const connectWallet = async () => {
    if (state.runtimeConfig.mockWalletFlow) {
      state.connectedWallet = els.wallet.value;
      updateWalletPill();
      return;
    }
    if (!window.ethereum) throw new Error('MetaMask not detected');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts.length) throw new Error('No wallet account available');
    [state.connectedWallet] = accounts;
    els.wallet.value = state.connectedWallet;
    updateWalletPill();
  };

  const ensureRegistration = async () => {
    if (state.isRegistered) return;
    const wallet = state.connectedWallet || els.wallet.value;
    if (!wallet || !wallet.startsWith('0x')) throw new Error('Wallet must be a valid 0x address');

    const clientId = `oak-supply-chain-${wallet.slice(2, 10)}`;
    const form = new URLSearchParams({
      walletAddress: wallet,
      clientId,
      clientUrl: window.location.origin,
    });

    const res = await fetch(`${getValidatorBase()}/v1/register-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

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
  };

  const getQuote = async (sizeBytes) => {
    const intent = INTENTS[state.selectedIntent];
    const body = {
      wallet: els.wallet.value,
      organization: els.org.value,
      depth: intent.depth,
      schemaId: 'schema:doc-envelope',
      schemaVersion: '1.0.0',
      estimatedBytes: sizeBytes,
    };

    const res = await fetch(`${getNormalizerBase()}/v1/pricing/envelope-quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`quote failed ${res.status}`);
    state.latestQuote = await res.json();

    const wei = state.latestQuote.totalFeeWei;
    els.quoteLabel.textContent = `${wei} wei`;
    return state.latestQuote;
  };

  const normalizeAndMap = async () => {
    const intent = INTENTS[state.selectedIntent];
    const form = new FormData();
    form.append('file', state.selectedFile);
    form.append('wallet', els.wallet.value);
    form.append('organization', els.org.value);
    form.append('depth', intent.depth);
    form.append('promptProfile', intent.promptProfile);
    form.append('schemaId', 'schema:doc-envelope');
    form.append('schemaVersion', '1.0.0');

    const res = await fetch(`${getNormalizerBase()}/v1/ingress/normalize-upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`normalize failed ${res.status}: ${await res.text()}`);

    const normalized = await res.json();
    state.latestEnvelope = normalized.envelopeDraft;

    const jcrRes = await fetch(`${getNormalizerBase()}/v1/envelopes/jcr-map`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ envelope: normalized.envelopeDraft }),
    });
    if (!jcrRes.ok) throw new Error(`jcr map failed ${jcrRes.status}`);
    const jcrMap = await jcrRes.json();

    setDev({ stage: 'normalize-map', normalized, jcrMap });

    return normalized;
  };

  const submitWrite = async () => {
    let wallet;
    let paymentTx;
    let signature;

    if (state.runtimeConfig.mockWalletFlow) {
      wallet = els.wallet.value;
      if (!wallet || !wallet.startsWith('0x')) throw new Error('Mock wallet must be a 0x address');
      paymentTx = randomHex(32);
    } else {
      if (!window.ethereum) throw new Error('MetaMask not detected');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts.length) throw new Error('No wallet account available');
      [wallet] = accounts;
    }

    const paymentRecipient = getPaymentRecipient();
    if (!paymentRecipient || !paymentRecipient.startsWith('0x')) {
      throw new Error('Payment recipient unavailable. Set override in Developer Settings.');
    }

    if (!state.runtimeConfig.mockWalletFlow) {
      paymentTx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet,
          to: paymentRecipient,
          value: `0x${BigInt(state.latestQuote.totalFeeWei).toString(16)}`,
        }],
      });
    }

    const message = JSON.stringify({
      envelope: state.latestEnvelope,
      quoteId: state.latestQuote.quoteId,
      paymentTier: 'standard',
      timestamp: Date.now(),
      mode: state.runtimeConfig.mockWalletFlow ? 'mock' : 'live',
    });

    if (state.runtimeConfig.mockWalletFlow) {
      signature = randomHex(65);
    } else {
      signature = await window.ethereum.request({ method: 'personal_sign', params: [message, wallet] });
    }

    const form = new URLSearchParams({
      walletAddress: wallet,
      message,
      contentType: 'envelope',
      paymentTier: 'standard',
      ethereumTxHash: paymentTx,
      signature,
    });

    const res = await fetch(`${getValidatorBase()}/v1/propose-write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

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
      validatorUrl: `${getValidatorBase()}/v1/propose-write`,
      paymentRecipient,
      ethereumTxHash: paymentTx,
      signature,
      response: payload,
    };
    setDev(detail);

    if (!res.ok) throw new Error(payload?.error || payload?.message || `validator rejected proposal (${res.status})`);

    return detail;
  };

  const writeFlow = async () => {
    if (state.busy) return;
    if (!state.selectedFile) {
      setStatus('Add a PDF first');
      return;
    }

    clearSteps();
    setBusy(true);
    setStatus('Starting flow...');

    try {
      markActive('connect');
      if (!state.connectedWallet) await connectWallet();
      markDone('connect');

      markActive('register');
      await discoverPaymentTarget();
      await ensureRegistration();
      markDone('register');

      markActive('extract');
      const normalized = await normalizeAndMap();
      markDone('extract');

      markActive('price');
      await getQuote(normalized.fileInfo.sizeBytes);
      markDone('price');

      markActive('commit');
      const result = await submitWrite();
      markDone('commit');

      markActive('done');
      markDone('done');
      els.successCard.classList.remove('hidden');
      els.contentCid.textContent = normalized?.fileInfo?.contentCid || '-';
      els.txHash.textContent = result?.ethereumTxHash || '-';
      setStatus('Content written to Oak successfully');
    } catch (e) {
      const active = els.steps.querySelector('.is-active');
      if (active) {
        markError(active.getAttribute('data-step'));
      }
      setStatus(`Flow failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const setIntent = (intent) => {
    state.selectedIntent = intent;
    const cfg = INTENTS[intent];
    els.intentSummary.textContent = cfg.summary;
    block.querySelectorAll('.ocs-intent-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-intent') === intent);
    });
  };

  const setFile = (file) => {
    state.selectedFile = file;
    updateFilePill();
  };

  els.drop.addEventListener('click', () => els.file.click());
  els.drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.drop.classList.add('is-drag');
  });
  els.drop.addEventListener('dragleave', () => {
    els.drop.classList.remove('is-drag');
  });
  els.drop.addEventListener('drop', (e) => {
    e.preventDefault();
    els.drop.classList.remove('is-drag');
    const [file] = e.dataTransfer.files;
    setFile(file || null);
  });

  els.file.addEventListener('change', () => {
    setFile(els.file.files[0] || null);
  });

  els.connectBtn.addEventListener('click', async () => {
    try {
      setStatus('Connecting wallet...');
      await connectWallet();
      setStatus('Wallet connected');
      markDone('connect');
    } catch (e) {
      setStatus(`Connect failed: ${e.message}`);
      markError('connect');
    }
  });

  els.writeBtn.addEventListener('click', writeFlow);

  block.querySelectorAll('.ocs-intent-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setIntent(btn.getAttribute('data-intent'));
    });
  });

  [els.validatorUrl, els.normalizerUrl, els.paymentRecipientOverride].forEach((input) => {
    input.addEventListener('change', async () => {
      await loadRuntimeConfig();
    });
  });

  clearSteps();
  updateWalletPill();
  updateFilePill();
  setIntent(state.selectedIntent);
  loadRuntimeConfig();
}
