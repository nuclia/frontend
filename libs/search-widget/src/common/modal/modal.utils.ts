export function freezeBackground(fullscreenModal = false) {
  if (fullscreenModal) {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
  } else {
    document.body.style.overflow = 'hidden';
  }
}

export function unblockBackground(fullscreenModal = false) {
  if (fullscreenModal) {
    const body = document.body;
    const scrollY = body.style.top;
    body.style.position = '';
    body.style.top = '';
    setTimeout(() => scrollBackTo(scrollY));
  } else {
    document.body.style.overflow = 'inherit';
  }
}

function scrollBackTo(scrollY: string) {
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}
