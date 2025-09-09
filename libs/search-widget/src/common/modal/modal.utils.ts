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

function getFixedRootParent(element: HTMLElement): HTMLElement {
  if (element.tagName === 'BODY') {
    return element;
  }
  // an element with `position: fixed` will be positioned relatively to the viewport
  // unless one of the ancestor has a property `transform`, `filter`, `perspective`
  // or has a containerType which is not normal
  const style = getComputedStyle(element);
  if (
    style.transform !== 'none' ||
    style.perspective !== 'none' ||
    style.filter !== 'none' ||
    (!!style.containerType && style.containerType !== 'normal')
  ) {
    return element;
  } else {
    const parent = element.parentElement;
    if (parent) {
      return getFixedRootParent(parent);
    } else {
      const parentNode = element.parentNode;
      if (parentNode && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        return getFixedRootParent((parentNode as ShadowRoot).host as HTMLElement);
      } else {
        return element;
      }
    }
  }
}

export function getFixedRootParentIfAny(element: HTMLElement): HTMLElement | undefined {
  const fixedRoot = getFixedRootParent(element);
  return fixedRoot.tagName === 'BODY' ? undefined : fixedRoot;
}

export function iOSDevice() {
  return ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
    navigator.platform,
  );
}
