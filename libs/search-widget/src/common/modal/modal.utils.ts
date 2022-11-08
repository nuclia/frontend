export function freezeBackground() {
  const scrollY = window.scrollY;
  const body = document.body;
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
}

export function unblockBackground(fullscreenModal = false) {
  const body = document.body;
  const scrollY = body.style.top;
  body.style.position = '';
  body.style.top = '';

  // When modal is fullscreen like tiles, we need a timeout.
  // But when modal is not fullscreen, the timeout makes the background flicker on close.
  fullscreenModal ? setTimeout(() => scrollBackTo(scrollY)) : scrollBackTo(scrollY);
}

function scrollBackTo(scrollY: string) {
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}
