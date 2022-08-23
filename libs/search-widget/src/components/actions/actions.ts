export function clickOutside(node: HTMLElement) {
  const handleClick = (event: Event) => {
    if (!node.contains(event.composedPath()[0] as HTMLElement)) {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };
  document.addEventListener('click', handleClick, true);
  document.addEventListener('contextmenu', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('contextmenu', handleClick, true);
    },
  };
}
