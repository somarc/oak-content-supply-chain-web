const SAMPLE_QUEUE = [
  'CONTRACT_A21.PDF',
  'NOTES_Q3_FIN.TXT',
  'LEASE_AGREEMENT.PDF',
  'MEMO_DRAFT_V2.TXT',
];

const SAMPLE_JCR = [
  {
    path: '/content/uploads/contract_a21',
    properties: [
      ['jcr:primaryType', 'nt:unstructured'],
      ['jcr:created', '2023-10-27T09:41:00'],
    ],
  },
  {
    path: '/metadata',
    indent: 1,
    properties: [
      ['extracted:summary', '"The agreement outlines..."'],
      ['extracted:entities', '[Array: 4 items]'],
    ],
  },
  {
    path: '/renditions',
    indent: 1,
    properties: [
      ['jcr:mimeType', 'application/json'],
      ['jcr:data', '{ "blob": "binary..." }'],
    ],
  },
  {
    path: '/analysis',
    indent: 1,
    properties: [
      ['llm:model', '"qwen3:8b"'],
      ['llm:tokens', '4021'],
    ],
  },
];

function renderQueue() {
  return SAMPLE_QUEUE.map((name, idx) => `
    <li class="ljm-nav-item">
      <button class="ljm-nav-link ${idx === 0 ? 'is-active' : ''}" type="button" data-file="${name}">
        <span>${name}</span>
        <span class="ljm-nav-arrow">-></span>
      </button>
    </li>
  `).join('');
}

function renderJcr() {
  return SAMPLE_JCR.map((node) => {
    const margin = node.indent ? ' style="margin-left:20px"' : '';
    const propMargin = node.indent ? ' style="margin-left:44px"' : '';
    const props = node.properties.map(([k, v]) => `
      <div class="ljm-jcr-prop"${propMargin}>
        <div class="ljm-jcr-key">${k}</div>
        <div class="ljm-jcr-value">${v}</div>
      </div>
    `).join('');

    return `
      <article class="ljm-jcr-node">
        <button class="ljm-jcr-node-header" type="button"${margin}>
          <span class="ljm-label">${node.path}</span>
        </button>
        <div class="ljm-jcr-props">
          ${props}
        </div>
      </article>
    `;
  }).join('');
}

function template() {
  return `
    <section class="ljm-app-container">
      <aside class="ljm-sidebar">
        <div class="ljm-brand">
          <div class="ljm-star-icon"></div>
          <span>LANGEXTRACT</span>
        </div>

        <button class="ljm-drop-zone" type="button">
          <span class="ljm-drop-zone-icon">v</span>
          <span class="ljm-label">Drop PDF / Text Payload</span>
        </button>

        <span class="ljm-label ljm-extraction-label">Extraction Queue</span>
        <ul class="ljm-nav-list">${renderQueue()}</ul>

        <div class="ljm-meta-grid">
          <div class="ljm-meta-item">
            <label>API Status</label>
            <div class="ljm-meta-online"><span></span>ONLINE</div>
          </div>
          <div class="ljm-meta-item">
            <label>Version</label>
            <div>2.4.1 (BETA)</div>
          </div>
        </div>
      </aside>

      <main class="ljm-main-content">
        <header class="ljm-top-bar">
          <div class="ljm-breadcrumbs">
            <h2 data-el="title">CONTRACT_A21.PDF</h2>
            <span class="ljm-status-badge">Processed</span>
          </div>
          <div class="ljm-actions">
            <button class="ljm-btn" type="button">View Raw</button>
            <button class="ljm-btn is-primary" type="button">Export JSON</button>
          </div>
        </header>

        <div class="ljm-workspace">
          <section class="ljm-panel">
            <div class="ljm-panel-header">
              <div>
                <span class="ljm-label">Source Document</span>
                <div class="ljm-panel-title">INSIGHTS</div>
              </div>
              <div class="ljm-star-icon ljm-star-sm"></div>
            </div>
            <div class="ljm-panel-content">
              <section class="ljm-summary">
                <span class="ljm-label ljm-section-label">Executive Summary</span>
                <p class="ljm-source-text">
                  The agreement outlines a <span class="ljm-highlight">3-year term</span> commencing on <span class="ljm-highlight">January 1st, 2024</span>. Primary obligations include the maintenance of server infrastructure and quarterly compliance audits. Failure to meet the <span class="ljm-highlight">99.9% uptime SLA</span> results in penalty fees calculated at 5% of monthly recurring revenue.
                </p>
              </section>

              <section>
                <span class="ljm-label ljm-section-label">Entity Extraction</span>
                <div class="ljm-jcr-prop">
                  <div class="ljm-jcr-key">ORG</div>
                  <div class="ljm-jcr-value">Acme Corp, ServerPro Ltd.</div>
                </div>
                <div class="ljm-jcr-prop">
                  <div class="ljm-jcr-key">DATE</div>
                  <div class="ljm-jcr-value">2024-01-01, Quarterly</div>
                </div>
                <div class="ljm-jcr-prop">
                  <div class="ljm-jcr-key">MONEY</div>
                  <div class="ljm-jcr-value">5% MRR</div>
                </div>
              </section>
            </div>
          </section>

          <section class="ljm-panel">
            <div class="ljm-panel-header">
              <div>
                <span class="ljm-label">Repository Mapping</span>
                <div class="ljm-panel-title">JCR ENVELOPE</div>
              </div>
              <div class="ljm-label ljm-mono">JSON_CR</div>
            </div>
            <div class="ljm-panel-content ljm-panel-content-tight">${renderJcr()}</div>
          </section>
        </div>
      </main>
    </section>
  `;
}

export default function decorate(block) {
  block.textContent = '';
  block.innerHTML = template();

  const titleEl = block.querySelector('[data-el="title"]');
  const queueButtons = [...block.querySelectorAll('.ljm-nav-link')];
  queueButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      queueButtons.forEach((node) => node.classList.remove('is-active'));
      btn.classList.add('is-active');
      const selected = btn.getAttribute('data-file') || 'CONTRACT_A21.PDF';
      titleEl.textContent = selected;
    });
  });

  const jcrNodes = [...block.querySelectorAll('.ljm-jcr-node')];
  jcrNodes.forEach((node) => {
    const header = node.querySelector('.ljm-jcr-node-header');
    const props = node.querySelector('.ljm-jcr-props');
    header.addEventListener('click', () => {
      props.classList.toggle('is-hidden');
    });
  });
}
