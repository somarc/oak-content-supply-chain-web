export default function decorate(block) {
  // Keep DA-authored key/value rows intact so footer block can parse them.
  block.classList.add('footer-meta-pass');
}

