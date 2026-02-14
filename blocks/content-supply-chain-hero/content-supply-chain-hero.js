function readRows(block) {
  return [...block.children].map((row) => {
    const cols = [...row.children];
    return cols.map((col) => (col.textContent || '').trim()).filter(Boolean);
  }).filter((row) => row.length > 0);
}

export default function decorate(block) {
  const rows = readRows(block);
  const kicker = rows[0]?.[0] || 'Oak Content Supply Chain';
  const title = rows[1]?.[0] || 'Drop content. Write once. Move on.';
  const subtitle = rows[2]?.[0] || 'Connect your wallet, add a document, and let Oak handle provenance, enveloping, and network commit in one polished flow.';
  const pillsRaw = rows[3]?.[0] || 'Wallet-scoped ownership, Provenance envelope, Deterministic JCR mapping, Validator proposal flow';
  const velocityKicker = rows[4]?.[0] || 'Immutable Velocity';
  const velocityCopy = rows[5]?.[0] || 'Convert unstructured content into verifiable, wallet-scoped records in one motion layer. Deterministic envelopes remove campaign latency and accelerate trusted distribution across the Oak fabric.';
  const pills = pillsRaw.split(',').map((v) => v.trim()).filter(Boolean);
  const pipeline = [
    'Stage content payload',
    'Extract + normalize envelope',
    'Estimate proposal cost',
    'Sign + submit write',
  ];

  block.textContent = '';

  const hero = document.createElement('section');
  hero.className = 'ocs-hero-block';

  const main = document.createElement('div');
  main.className = 'ocs-hero-main';

  const side = document.createElement('aside');
  side.className = 'ocs-hero-side';

  const kickerEl = document.createElement('p');
  kickerEl.className = 'ocs-hero-kicker';
  kickerEl.textContent = kicker;

  const titleEl = document.createElement('h2');
  titleEl.className = 'ocs-hero-title';
  titleEl.textContent = title;

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'ocs-hero-subtitle';
  subtitleEl.textContent = subtitle;

  const pillsEl = document.createElement('div');
  pillsEl.className = 'ocs-hero-pills';
  pills.forEach((pill) => {
    const span = document.createElement('span');
    span.textContent = pill;
    pillsEl.append(span);
  });

  const machine = document.createElement('section');
  machine.className = 'ocs-hero-machine';
  machine.innerHTML = `
    <p class="ocs-hero-machine-label">Write Flow State Machine</p>
    <div class="ocs-hero-machine-rail">
      <span class="ocs-hero-tracer" aria-hidden="true"></span>
      <ol class="ocs-hero-machine-steps">
        <li><span>01</span>Preflight</li>
        <li><span>02</span>Extract</li>
        <li><span>03</span>Quote</li>
        <li><span>04</span>Sign</li>
        <li><span>05</span>Commit</li>
      </ol>
    </div>
  `;

  const velocity = document.createElement('section');
  velocity.className = 'ocs-hero-velocity';
  velocity.innerHTML = `
    <p class="ocs-hero-velocity-kicker">${velocityKicker}</p>
    <p class="ocs-hero-velocity-copy">${velocityCopy}</p>
  `;

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'ocs-hero-ctas';
  ctaWrap.innerHTML = `
    <a class="ocs-hero-cta is-primary" href="/ingest-workbench">Open Ingest Workbench</a>
    <a class="ocs-hero-cta" href="/jcr-manager">View JCR Manager</a>
  `;

  const panelTitle = document.createElement('p');
  panelTitle.className = 'ocs-hero-panel-label';
  panelTitle.textContent = 'Pipeline View';

  const mark = document.createElement('div');
  mark.className = 'ocs-hero-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = `
    <svg viewBox="0 0 320 220" role="img">
      <defs>
        <linearGradient id="ocsHex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7affeb"></stop>
          <stop offset="100%" stop-color="#9fb6ff"></stop>
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#ocsHex)" stroke-width="2">
        <polygon points="102,38 90,58 66,58 54,38 66,18 90,18"></polygon>
        <polygon points="160,24 148,44 124,44 112,24 124,4 148,4"></polygon>
        <polygon points="218,38 206,58 182,58 170,38 182,18 206,18"></polygon>
        <polygon points="73,90 61,110 37,110 25,90 37,70 61,70"></polygon>
        <polygon points="131,90 119,110 95,110 83,90 95,70 119,70"></polygon>
        <polygon points="189,90 177,110 153,110 141,90 153,70 177,70"></polygon>
        <polygon points="247,90 235,110 211,110 199,90 211,70 235,70"></polygon>
      </g>
      <g fill="none" stroke="#8b93aa" stroke-width="2">
        <line x1="78" y1="58" x2="102" y2="76"></line>
        <line x1="136" y1="44" x2="131" y2="70"></line>
        <line x1="194" y1="58" x2="178" y2="76"></line>
        <line x1="102" y1="106" x2="131" y2="128"></line>
        <line x1="160" y1="106" x2="160" y2="128"></line>
        <line x1="218" y1="106" x2="189" y2="128"></line>
      </g>
      <g fill="#7affeb" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700">
        <text x="73" y="44">#</text>
        <text x="131" y="30">#</text>
        <text x="189" y="44">#</text>
        <text x="44" y="96">#</text>
        <text x="102" y="96">#</text>
        <text x="160" y="96">#</text>
        <text x="218" y="96">#</text>
      </g>
      <g fill="none" stroke="#b9bfd1" stroke-width="3">
        <line x1="160" y1="126" x2="160" y2="170"></line>
        <line x1="160" y1="145" x2="140" y2="161"></line>
        <line x1="160" y1="151" x2="183" y2="169"></line>
      </g>
      <g fill="none" stroke="#7affeb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M154 161 C154 153 160 149 168 147"></path>
        <path d="M122 184 C122 170 137 160 160 160 C183 160 198 170 198 184 C198 194 190 201 177 205 L160 215 L143 205 C130 201 122 194 122 184 Z"></path>
        <path d="M128 178 C134 172 146 168 160 168 C174 168 186 172 192 178"></path>
      </g>
      <g fill="none" stroke="#7affeb" stroke-width="2" stroke-linecap="round">
        <path d="M160 176 L160 210"></path>
        <path d="M146 184 L146 202"></path>
        <path d="M174 184 L174 202"></path>
        <path d="M138 196 L146 196"></path>
        <path d="M174 194 L182 194"></path>
      </g>
    </svg>
  `;

  const panelList = document.createElement('ol');
  panelList.className = 'ocs-hero-flow';
  pipeline.forEach((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    panelList.append(item);
  });

  const sideSignals = document.createElement('div');
  sideSignals.className = 'ocs-hero-signals';
  sideSignals.innerHTML = `
    <p><span>Runtime</span><strong>Live</strong></p>
    <p><span>Network</span><strong>Sepolia</strong></p>
    <p><span>CID Mode</span><strong>Client + Validator</strong></p>
  `;

  main.append(kickerEl, titleEl, subtitleEl, ctaWrap, pillsEl, machine, velocity);
  side.append(mark, panelTitle, panelList, sideSignals);
  hero.append(main, side);
  block.append(hero);
}
