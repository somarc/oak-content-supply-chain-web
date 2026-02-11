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
  const pills = pillsRaw.split(',').map((v) => v.trim()).filter(Boolean);

  block.textContent = '';

  const hero = document.createElement('section');
  hero.className = 'ocs-hero-block';

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

  hero.append(kickerEl, titleEl, subtitleEl, pillsEl);
  block.append(hero);
}
