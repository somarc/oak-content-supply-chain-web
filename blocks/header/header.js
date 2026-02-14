import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');
const DEFAULT_VALIDATOR_BASE = 'http://127.0.0.1:8787/ops/v1/content-chain/validator';
const DEFAULT_NORMALIZER_BASE = 'http://127.0.0.1:8088';

function cleanBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

function timeoutFetch(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

function inferNetworkName(payload) {
  const root = payload?.data || payload?.config || payload || {};
  const value = root?.network
    || root?.networkName
    || root?.chainName
    || root?.chain
    || root?.ethereumNetwork
    || root?.targetNetwork
    || root?.mode
    || '';
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.includes('sep')) return 'sepolia';
  if (normalized.includes('main')) return 'mainnet';
  return normalized;
}

function normalizeAddress(value) {
  return String(value || '').trim();
}

function shortAddress(value) {
  const text = normalizeAddress(value);
  if (!text.startsWith('0x') || text.length < 12) return text || 'not connected';
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function chainLabelFromId(chainId) {
  const normalized = String(chainId || '').toLowerCase();
  if (normalized === '0xaa36a7') return 'sepolia';
  if (normalized === '0x1') return 'mainnet';
  return 'unknown';
}

function formatWeiToEth(weiHex) {
  try {
    const wei = BigInt(weiHex || '0');
    const whole = wei / 1000000000000000000n;
    const frac = wei % 1000000000000000000n;
    const trimmed = `${frac}`.padStart(18, '0').slice(0, 4).replace(/0+$/, '');
    return trimmed ? `${whole}.${trimmed}` : `${whole}`;
  } catch (_e) {
    return '-';
  }
}

function closeAllNavSections(sections) {
  sections.querySelectorAll(':scope .nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? forceExpanded : nav.getAttribute('aria-expanded') !== 'true';
  document.body.style.overflowY = expanded ? 'hidden' : '';
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');

  if (!expanded) {
    closeAllNavSections(navSections);
  }

  const button = nav.querySelector('.nav-hamburger button');
  button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
}

function decorateNavSections(navSections) {
  navSections.querySelectorAll(':scope .nav-sections > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) {
      navSection.classList.add('nav-drop');
      navSection.setAttribute('aria-expanded', 'false');
    }
  });
}

function buildNav(fragment) {
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';

  const sections = fragment.querySelectorAll(':scope > div');
  const brand = sections[0] || document.createElement('div');
  const navSections = sections[1] || document.createElement('div');
  const tools = sections[2] || document.createElement('div');

  brand.className = 'nav-brand';
  navSections.className = 'nav-sections';
  tools.className = 'nav-tools';

  const brandLink = brand.querySelector('a');
  if (brandLink && !brandLink.querySelector('.nav-brand-mark')) {
    brandLink.insertAdjacentHTML('afterbegin', `
      <span class="nav-brand-mark" aria-hidden="true">
        <svg class="nav-brand-logo" viewBox="0 0 28 28" role="img">
          <defs>
            <linearGradient id="navBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7affeb"></stop>
              <stop offset="100%" stop-color="#9fb6ff"></stop>
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#navBrandGrad)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="14,2 21,6 21,14 14,18 7,14 7,6"></polygon>
            <path d="M14 18 L14 25"></path>
            <path d="M10 22 C11.5 20.5 13 19.8 14 19.6"></path>
            <path d="M14 20 C15.5 19.8 17.5 20.6 19 22"></path>
          </g>
        </svg>
      </span>
    `);
  }

  decorateNavSections(navSections);

  const wallet = document.createElement('div');
  wallet.className = 'nav-wallet';
  wallet.innerHTML = `
    <span class="nav-signal-pill">Network: <strong data-ocs-el="networkPill">detecting</strong></span>
    <span class="nav-signal-pill">Link: <strong data-ocs-el="linkPill">checking</strong></span>
    <span class="nav-wallet-pill" data-ocs-el="walletAddress">Wallet: not connected</span>
    <span class="nav-wallet-pill" data-ocs-el="walletChain">Chain: unknown</span>
    <span class="nav-wallet-pill" data-ocs-el="walletBalance">Balance: -</span>
    <button type="button" class="nav-wallet-btn" data-ocs-el="connectWalletBtn">Connect</button>
    <button type="button" class="nav-wallet-btn nav-wallet-btn-ghost hidden" data-ocs-el="clearWalletBtn">Clear</button>
  `;
  tools.append(wallet);

  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav, navSections));

  const connectBtn = wallet.querySelector('[data-ocs-el="connectWalletBtn"]');
  const clearBtn = wallet.querySelector('[data-ocs-el="clearWalletBtn"]');
  const walletAddressEl = wallet.querySelector('[data-ocs-el="walletAddress"]');
  const walletChainEl = wallet.querySelector('[data-ocs-el="walletChain"]');
  const walletBalanceEl = wallet.querySelector('[data-ocs-el="walletBalance"]');

  let walletState = {
    connected: false,
    address: '',
    chain: 'unknown',
    balance: '-',
  };

  const renderWallet = ({ connected = false, address = '', chain = 'unknown', balance = '-' } = {}) => {
    walletState = { connected, address, chain, balance };
    if (walletAddressEl) walletAddressEl.textContent = connected ? `Wallet: ${shortAddress(address)}` : 'Wallet: not connected';
    if (walletChainEl) walletChainEl.textContent = `Chain: ${chain || 'unknown'}`;
    if (walletBalanceEl) walletBalanceEl.textContent = `Balance: ${balance || '-'} ETH`;
    if (connectBtn) connectBtn.textContent = connected ? 'Refresh' : 'Connect';
    if (clearBtn) clearBtn.classList.toggle('hidden', !connected);
  };

  const connectWalletFallback = async ({ interactive = true } = {}) => {
    if (!window.ethereum?.request) return false;
    if (interactive) {
      try {
        await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      } catch (error) {
        if (error?.code === 4001) return false;
      }
    }
    const accounts = await window.ethereum.request({ method: interactive ? 'eth_requestAccounts' : 'eth_accounts' });
    if (!accounts?.length) {
      renderWallet({ connected: false });
      return false;
    }
    const address = normalizeAddress(accounts[0]);
    const [chainId, balanceWei] = await Promise.all([
      window.ethereum.request({ method: 'eth_chainId' }),
      window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] }),
    ]);
    const chain = chainLabelFromId(chainId);
    const balance = formatWeiToEth(balanceWei);
    renderWallet({ connected: true, address, chain, balance });
    const detail = { connected: true, shortAddress: shortAddress(address), chain, balance };
    window.dispatchEvent(new CustomEvent('ocs:wallet-state', {
      detail: { connected: true, shortAddress: shortAddress(address), chain, balance },
    }));
    return detail;
  };

  const clearWalletFallback = () => {
    renderWallet({ connected: false });
    window.dispatchEvent(new CustomEvent('ocs:wallet-state', {
      detail: { connected: false, shortAddress: 'not connected', chain: 'unknown', balance: '-' },
    }));
  };

  window.__ocsWalletBridge = {
    connect: (interactive = true) => connectWalletFallback({ interactive }),
    refresh: () => connectWalletFallback({ interactive: false }),
    clear: clearWalletFallback,
    getState: () => ({ ...walletState }),
  };

  connectBtn?.addEventListener('click', () => {
    connectWalletFallback({ interactive: true });
  });
  clearBtn?.addEventListener('click', () => {
    clearWalletFallback();
  });

  window.addEventListener('ocs:wallet-state', (event) => {
    const detail = event?.detail || {};
    const connected = Boolean(detail.connected);
    const address = wallet.querySelector('[data-ocs-el="walletAddress"]');
    const chain = wallet.querySelector('[data-ocs-el="walletChain"]');
    const balance = wallet.querySelector('[data-ocs-el="walletBalance"]');

    if (address) address.textContent = connected ? `Wallet: ${detail.shortAddress || 'connected'}` : 'Wallet: not connected';
    if (chain) chain.textContent = `Chain: ${detail.chain || 'unknown'}`;
    if (balance) balance.textContent = `Balance: ${detail.balance || '-'} ETH`;
    if (connectBtn) connectBtn.textContent = connected ? 'Refresh' : 'Connect';
    if (clearBtn) clearBtn.classList.toggle('hidden', !connected);
  });

  const headerNetwork = wallet.querySelector('[data-ocs-el="networkPill"]');
  const headerLink = wallet.querySelector('[data-ocs-el="linkPill"]');

  const refreshHeaderTelemetry = async () => {
    // Runtime pages own the pills; keep homepage and non-runtime pages fresh.
    if (document.querySelector('.content-supply-chain-app')) return;

    const validatorBase = cleanBase(window.localStorage.getItem('ocs.validatorUrl') || DEFAULT_VALIDATOR_BASE);
    const normalizerBase = cleanBase(window.localStorage.getItem('ocs.normalizerUrl') || DEFAULT_NORMALIZER_BASE);

    let validatorOk = false;
    let normalizerOk = false;
    let network = 'unknown';

    try {
      const [queueRes, chainRes] = await Promise.all([
        timeoutFetch(`${validatorBase}/v1/proposals/queue/stats`),
        timeoutFetch(`${validatorBase}/v1/blockchain/config`),
      ]);
      validatorOk = queueRes.ok;
      if (chainRes.ok) {
        network = inferNetworkName(await chainRes.json());
      }
    } catch (_e) {
      validatorOk = false;
    }

    try {
      const runtimeRes = await timeoutFetch(`${normalizerBase}/v1/runtime-config`);
      normalizerOk = runtimeRes.ok;
    } catch (_e) {
      normalizerOk = false;
    }

    if (headerNetwork) headerNetwork.textContent = validatorOk ? network : 'offline';
    if (headerLink) headerLink.textContent = validatorOk && normalizerOk ? 'active' : 'degraded';
  };

  refreshHeaderTelemetry();
  window.setInterval(refreshHeaderTelemetry, 10000);
  connectWalletFallback({ interactive: false });
  if (window.ethereum?.on) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (!accounts?.length) {
        clearWalletFallback();
        return;
      }
      connectWalletFallback({ interactive: false });
    });
    window.ethereum.on('chainChanged', () => {
      connectWalletFallback({ interactive: false });
    });
  }

  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) {
      document.body.style.overflowY = '';
      nav.setAttribute('aria-expanded', 'false');
      closeAllNavSections(navSections);
    }
  });

  nav.append(brand, hamburger, navSections, tools);
  return nav;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta || '/nav';
  let fragment = await loadFragment(navPath);

  if (!fragment && navPath !== '/nav') {
    fragment = await loadFragment('/nav');
  }

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  if (fragment) {
    wrapper.append(buildNav(fragment));
  }

  block.append(wrapper);
}
