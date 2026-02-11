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
    <section class="ocs-hero">
      <p class="ocs-kicker">Oak Chain Primitive</p>
      <h2>Content Supply Chain Interface</h2>
      <p class="ocs-subtitle">Connect wallet, register ownership, normalize document context, and submit validator proposals.</p>
      <div class="ocs-pills">
        <span>Wallet-scoped ownership</span>
        <span>Provenance envelope</span>
        <span>Deterministic JCR mapping</span>
        <span>Validator proposal flow</span>
      </div>
    </section>

    <section class="ocs-onboard">
      <div class="ocs-panel ocs-stack">
        <h3>1) Connect</h3>
        <label>Wallet (auto-filled after connect)</label>
        <input data-el="wallet" value="0x742d35Cc6634c0532925a3b844bc9e7595f0beb" />

        <label>Validator URL</label>
        <input data-el="validatorUrl" value="http://127.0.0.1:8090" />

        <label>Normalizer API URL</label>
        <input data-el="normalizerUrl" value="http://127.0.0.1:8088" />

        <label>Organization</label>
        <input data-el="org" value="example-org" />

        <details>
          <summary>Advanced: payment target override</summary>
          <label>Payment recipient override (optional)</label>
          <input data-el="paymentRecipientOverride" placeholder="0x... (only if auto-discovery fails)" />
        </details>

        <div class="ocs-row-btns">
          <button data-el="connectBtn">Connect Wallet</button>
          <button data-el="registerBtn" class="secondary">Register with Oak Chain</button>
        </div>

        <p data-el="status" class="ocs-badge">Ready</p>
      </div>

      <div class="ocs-panel ocs-stack">
        <h3>2) Access Gate</h3>
        <div data-el="modeState" class="ocs-state"><strong>Runtime:</strong> detecting...</div>
        <div data-el="paymentState" class="ocs-state warn"><strong>Payment Target:</strong> not discovered</div>
        <div data-el="walletState" class="ocs-state warn"><strong>Wallet:</strong> not connected</div>
        <div data-el="registrationState" class="ocs-state warn"><strong>Registration:</strong> not registered</div>
        <pre data-el="registrationResponse">{"status":"not_registered"}</pre>
        <button data-el="unlockBtn" class="ghost" disabled>Workspace unlocks automatically after successful registration</button>
      </div>
    </section>

    <section data-el="workspace" class="ocs-workspace hidden">
      <div class="ocs-workspace-grid">
        <div class="ocs-panel ocs-sticky">
          <h3>Ingestion Workspace</h3>

          <div data-el="drop" class="ocs-drop">
            <strong>Drag PDF here</strong><br />
            or click to pick a file
            <input data-el="file" type="file" accept="application/pdf" style="display:none" />
          </div>

          <label>Depth</label>
          <select data-el="depth">
            <option value="L1">L1 - minimal metadata</option>
            <option value="L2" selected>L2 - assets + hierarchy</option>
            <option value="L3">L3 - deep graph</option>
          </select>

          <label>Payment Tier</label>
          <select data-el="paymentTier">
            <option value="standard" selected>standard</option>
            <option value="express">express</option>
            <option value="priority">priority</option>
          </select>

          <label>Prompt Profile</label>
          <input data-el="promptProfile" value="assets-metadata-hierarchy" />

          <button data-el="run">Run Normalize + JCR Map</button>
          <button data-el="quoteBtn" class="secondary" type="button">Get Quote Only</button>
          <button data-el="submitBtn" class="ghost" type="button">Pay + Sign + Submit Proposal</button>

          <h3>Delete Owned Content</h3>
          <label>Content Path (must be in your wallet namespace)</label>
          <input data-el="deletePath" placeholder="/oak-chain/74/2d/35/0x.../example-org/content/documents/doc-id" />
          <label>Delete Fee Wei</label>
          <input data-el="deleteFeeWei" value="1000000000000" />
          <button data-el="deleteBtn" class="secondary" type="button">Pay + Sign + Submit Delete</button>
        </div>

        <div class="ocs-panel">
          <div class="ocs-meta" data-el="meta"></div>

          <h3>Envelope JSON</h3>
          <pre data-el="envelope">{}</pre>

          <h3>JCR Envelope Map</h3>
          <pre data-el="jcr">{}</pre>

          <h3>Quote</h3>
          <pre data-el="quote">{}</pre>

          <h3>Proposal Submit</h3>
          <pre data-el="proposal">{"status":"not_submitted"}</pre>

          <h3>Delete Submit</h3>
          <pre data-el="deleteResult">{"status":"not_submitted"}</pre>
        </div>
      </div>
    </section>
  `;
}

export default function decorate(block) {
  block.textContent = '';
  block.innerHTML = template();

  const state = {
    selectedFile: null,
    connectedWallet: null,
    latestEnvelope: null,
    latestQuote: null,
    runtimeConfig: { normalizerMode: 'mock', mockWalletFlow: true },
    isRegistered: false,
    discoveredPaymentTarget: null,
  };

  const q = (name) => block.querySelector(`[data-el="${name}"]`);

  const els = {
    drop: q('drop'),
    file: q('file'),
    runBtn: q('run'),
    quoteBtn: q('quoteBtn'),
    submitBtn: q('submitBtn'),
    deleteBtn: q('deleteBtn'),
    connectBtn: q('connectBtn'),
    registerBtn: q('registerBtn'),
    unlockBtn: q('unlockBtn'),
    status: q('status'),
    modeState: q('modeState'),
    paymentState: q('paymentState'),
    walletState: q('walletState'),
    registrationState: q('registrationState'),
    registrationResponse: q('registrationResponse'),
    workspace: q('workspace'),
    envelope: q('envelope'),
    jcr: q('jcr'),
    quote: q('quote'),
    proposal: q('proposal'),
    deleteResult: q('deleteResult'),
    meta: q('meta'),
    wallet: q('wallet'),
    validatorUrl: q('validatorUrl'),
    normalizerUrl: q('normalizerUrl'),
    org: q('org'),
    depth: q('depth'),
    promptProfile: q('promptProfile'),
    paymentTier: q('paymentTier'),
    paymentRecipientOverride: q('paymentRecipientOverride'),
    deletePath: q('deletePath'),
    deleteFeeWei: q('deleteFeeWei'),
  };

  const setStatus = (msg) => {
    els.status.textContent = msg;
  };

  const setState = (el, label, value, ok) => {
    el.classList.remove('ok', 'warn');
    el.classList.add(ok ? 'ok' : 'warn');
    el.innerHTML = `<strong>${label}:</strong> ${value}`;
  };

  const getNormalizerBase = () => (els.normalizerUrl.value || '').replace(/\/+$/, '');
  const getValidatorBase = () => (els.validatorUrl.value || '').replace(/\/+$/, '');

  const updateGate = () => {
    setState(els.walletState, 'Wallet', state.connectedWallet || 'not connected', !!state.connectedWallet);
    setState(els.registrationState, 'Registration', state.isRegistered ? 'registered' : 'not registered', state.isRegistered);
    els.workspace.classList.toggle('hidden', !state.isRegistered);
    els.unlockBtn.disabled = !state.isRegistered;
  };

  const getPaymentRecipient = () => {
    const override = (els.paymentRecipientOverride.value || '').trim();
    return override || state.discoveredPaymentTarget;
  };

  const discoverPaymentTarget = async () => {
    const override = (els.paymentRecipientOverride.value || '').trim();
    if (override) {
      state.discoveredPaymentTarget = override;
      setState(els.paymentState, 'Payment Target', `override ${override}`, true);
      return;
    }

    try {
      const res = await fetch(`${getValidatorBase()}/v1/blockchain/config`);
      if (!res.ok) throw new Error(`config ${res.status}`);
      const payload = await res.json();
      const root = payload?.data || payload?.config || payload;
      const candidatePairs = [
        ['paymentRecipient', root?.paymentRecipient],
        ['clusterWalletAddress', root?.clusterWalletAddress],
        ['walletAddress', root?.walletAddress],
        ['contractAddress', root?.contractAddress],
      ];
      const hit = candidatePairs.find(([, value]) => value && String(value).startsWith('0x'));
      if (!hit) throw new Error('payment recipient not present');
      const [source, value] = hit;
      state.discoveredPaymentTarget = String(value);
      const immutable = root?.paymentRecipientImmutable === true ? ' immutable' : '';
      setState(els.paymentState, 'Payment Target', `auto (${source}${immutable}) ${state.discoveredPaymentTarget}`, true);
    } catch (e) {
      state.discoveredPaymentTarget = null;
      setState(els.paymentState, 'Payment Target', 'not exposed by validator API (use advanced override)', false);
    }
  };

  const loadRuntimeConfig = async () => {
    try {
      const res = await fetch(`${getNormalizerBase()}/v1/runtime-config`);
      if (res.ok) {
        state.runtimeConfig = await res.json();
      }
      els.modeState.innerHTML = `<strong>Runtime:</strong> ${state.runtimeConfig.normalizerMode} (${state.runtimeConfig.mockWalletFlow ? 'mock wallet flow' : 'live wallet flow'})`;
      els.modeState.classList.add('ok');
      if (state.runtimeConfig.mockWalletFlow) {
        els.connectBtn.textContent = 'Mock Wallet Active';
      } else {
        els.connectBtn.textContent = 'Connect Wallet';
      }
    } catch (e) {
      els.modeState.innerHTML = '<strong>Runtime:</strong> normalizer unreachable';
      els.modeState.classList.add('warn');
    }
    await discoverPaymentTarget();
  };

  const connectWallet = async () => {
    if (state.runtimeConfig.mockWalletFlow) {
      state.connectedWallet = els.wallet.value;
      setStatus(`Mock wallet active: ${state.connectedWallet}`);
      updateGate();
      return;
    }
    if (!window.ethereum) throw new Error('MetaMask not detected');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts.length) throw new Error('No wallet account available');
    state.connectedWallet = accounts[0];
    els.wallet.value = state.connectedWallet;
    setStatus(`Wallet connected: ${state.connectedWallet}`);
    updateGate();
  };

  const registerWallet = async () => {
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

    els.registrationResponse.textContent = pretty({ status: res.status, response: payload });

    if (!res.ok) {
      state.isRegistered = false;
      updateGate();
      throw new Error(payload?.error || payload?.message || `register failed (${res.status})`);
    }

    state.isRegistered = true;
    updateGate();
    setStatus('Wallet registered with Oak Chain. Workspace unlocked.');
  };

  const setFile = (file) => {
    state.selectedFile = file;
    setStatus(file ? `Selected: ${file.name}` : 'No file selected');
  };

  const getQuote = async (sizeBytes) => {
    const body = {
      wallet: els.wallet.value,
      organization: els.org.value,
      depth: els.depth.value,
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
    els.quote.textContent = pretty(state.latestQuote);
    return state.latestQuote;
  };

  els.drop.addEventListener('click', () => els.file.click());
  els.file.addEventListener('change', () => setFile(els.file.files[0] || null));
  els.drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.drop.classList.add('drag');
  });
  els.drop.addEventListener('dragleave', () => els.drop.classList.remove('drag'));
  els.drop.addEventListener('drop', (e) => {
    e.preventDefault();
    els.drop.classList.remove('drag');
    const [file] = e.dataTransfer.files;
    setFile(file || null);
  });

  els.connectBtn.addEventListener('click', async () => {
    try {
      await connectWallet();
    } catch (e) {
      setStatus(`Wallet connect error: ${e.message}`);
    }
  });

  els.registerBtn.addEventListener('click', async () => {
    try {
      if (!state.connectedWallet) await connectWallet();
      await discoverPaymentTarget();
      setStatus('Registering wallet with validator...');
      await registerWallet();
    } catch (e) {
      setStatus(`Registration error: ${e.message}`);
    }
  });

  els.validatorUrl.addEventListener('change', () => {
    discoverPaymentTarget();
  });
  els.paymentRecipientOverride.addEventListener('change', () => {
    discoverPaymentTarget();
  });
  els.normalizerUrl.addEventListener('change', () => {
    loadRuntimeConfig();
  });

  els.quoteBtn.addEventListener('click', async () => {
    try {
      if (!state.isRegistered) throw new Error('Register wallet first');
      const fallbackSize = state.selectedFile ? state.selectedFile.size : 4096;
      setStatus('Fetching quote...');
      await getQuote(fallbackSize);
      setStatus('Quote ready');
    } catch (e) {
      setStatus(`Quote error: ${e.message}`);
    }
  });

  els.runBtn.addEventListener('click', async () => {
    if (!state.isRegistered) {
      setStatus('Register wallet first');
      return;
    }
    if (!state.selectedFile) {
      setStatus('Please select a PDF first');
      return;
    }

    try {
      setStatus('Uploading and normalizing...');
      const form = new FormData();
      form.append('file', state.selectedFile);
      form.append('wallet', els.wallet.value);
      form.append('organization', els.org.value);
      form.append('depth', els.depth.value);
      form.append('promptProfile', els.promptProfile.value);
      form.append('schemaId', 'schema:doc-envelope');
      form.append('schemaVersion', '1.0.0');

      const res = await fetch(`${getNormalizerBase()}/v1/ingress/normalize-upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`normalize failed ${res.status}: ${await res.text()}`);
      const normalized = await res.json();
      state.latestEnvelope = normalized.envelopeDraft;
      els.envelope.textContent = pretty(normalized.envelopeDraft);

      els.meta.innerHTML = '';
      const items = [
        ['confidence', normalized.confidence],
        ['depth', normalized.costProfile.depth],
        ['multiplier', normalized.costProfile.multiplier],
        ['contentCid', normalized.fileInfo.contentCid],
        ['sizeBytes', normalized.fileInfo.sizeBytes],
        ['sha256', normalized.fileInfo.sha256],
      ];
      items.forEach(([k, v]) => {
        const div = document.createElement('div');
        div.className = 'ocs-kv';
        div.textContent = `${k}: ${v}`;
        els.meta.appendChild(div);
      });

      setStatus('Mapping JCR envelope...');
      const jcrRes = await fetch(`${getNormalizerBase()}/v1/envelopes/jcr-map`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ envelope: normalized.envelopeDraft }),
      });
      if (!jcrRes.ok) throw new Error(`jcr map failed ${jcrRes.status}`);
      els.jcr.textContent = pretty(await jcrRes.json());

      setStatus('Fetching quote...');
      await getQuote(normalized.fileInfo.sizeBytes);
      setStatus('Complete: envelope + JCR map + quote ready');
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  });

  els.submitBtn.addEventListener('click', async () => {
    let submitContext = {};
    try {
      if (!state.isRegistered) throw new Error('Register wallet first');
      if (!state.latestEnvelope) throw new Error('Run Normalize + JCR Map first');
      if (!state.latestQuote) throw new Error('Generate quote first');

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
      const paymentTier = els.paymentTier.value;

      if (!paymentRecipient || !paymentRecipient.startsWith('0x')) {
        throw new Error('Payment recipient unavailable. Ensure /v1/blockchain/config exposes payment recipient or set override.');
      }

      if (!state.runtimeConfig.mockWalletFlow) {
        setStatus('Submitting payment transaction in MetaMask...');
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
        paymentTier,
        timestamp: Date.now(),
        mode: state.runtimeConfig.mockWalletFlow ? 'mock' : 'live',
      });

      if (state.runtimeConfig.mockWalletFlow) {
        signature = randomHex(65);
      } else {
        setStatus('Signing proposal payload...');
        signature = await window.ethereum.request({ method: 'personal_sign', params: [message, wallet] });
      }

      setStatus('Submitting proposal to validator...');
      const form = new URLSearchParams({
        walletAddress: wallet,
        message,
        contentType: 'envelope',
        paymentTier,
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

      submitContext = {
        ok: res.ok,
        status: res.status,
        mode: state.runtimeConfig.mockWalletFlow ? 'mock' : 'live',
        validatorUrl: `${getValidatorBase()}/v1/propose-write`,
        paymentRecipient,
        ethereumTxHash: paymentTx,
        signature,
        response: payload,
      };
      els.proposal.textContent = pretty(submitContext);

      if (!res.ok) throw new Error(payload?.error || payload?.message || `validator rejected proposal (${res.status})`);
      setStatus('Proposal submitted successfully');
    } catch (e) {
      els.proposal.textContent = pretty({ ...submitContext, ok: false, error: String(e) });
      setStatus(`Submit error: ${e.message}`);
    }
  });

  els.deleteBtn.addEventListener('click', async () => {
    let submitContext = {};
    try {
      if (!state.isRegistered) throw new Error('Register wallet first');

      const contentPath = (els.deletePath.value || '').trim();
      const paymentRecipient = getPaymentRecipient();
      const deleteFeeWei = (els.deleteFeeWei.value || '').trim();
      if (!contentPath) throw new Error('Enter content path to delete');
      if (!paymentRecipient || !paymentRecipient.startsWith('0x')) {
        throw new Error('Payment recipient unavailable. Ensure /v1/blockchain/config exposes payment recipient or set override.');
      }
      if (!/^\d+$/.test(deleteFeeWei)) throw new Error('Delete fee must be integer wei');

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

      if (!state.runtimeConfig.mockWalletFlow) {
        setStatus('Submitting delete payment transaction in MetaMask...');
        paymentTx = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: wallet,
            to: paymentRecipient,
            value: `0x${BigInt(deleteFeeWei).toString(16)}`,
          }],
        });
      }

      const deleteMessage = JSON.stringify({
        action: 'delete',
        contentPath,
        timestamp: Date.now(),
        mode: state.runtimeConfig.mockWalletFlow ? 'mock' : 'live',
      });

      if (state.runtimeConfig.mockWalletFlow) {
        signature = randomHex(65);
      } else {
        setStatus('Signing delete payload...');
        signature = await window.ethereum.request({ method: 'personal_sign', params: [deleteMessage, wallet] });
      }

      setStatus('Submitting delete proposal to validator...');
      const clientId = `oak-supply-chain-${wallet.slice(2, 10)}`;
      const form = new URLSearchParams({
        walletAddress: wallet,
        contentPath,
        ethereumTxHash: paymentTx,
        signature,
        clientId,
      });

      const res = await fetch(`${getValidatorBase()}/v1/propose-delete`, {
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

      submitContext = {
        ok: res.ok,
        status: res.status,
        mode: state.runtimeConfig.mockWalletFlow ? 'mock' : 'live',
        validatorUrl: `${getValidatorBase()}/v1/propose-delete`,
        paymentRecipient,
        contentPath,
        ethereumTxHash: paymentTx,
        signature,
        response: payload,
      };
      els.deleteResult.textContent = pretty(submitContext);

      if (!res.ok) throw new Error(payload?.error || payload?.message || `validator rejected delete (${res.status})`);
      setStatus('Delete proposal submitted successfully');
    } catch (e) {
      els.deleteResult.textContent = pretty({ ...submitContext, ok: false, error: String(e) });
      setStatus(`Delete error: ${e.message}`);
    }
  });

  loadRuntimeConfig();
  updateGate();
}
