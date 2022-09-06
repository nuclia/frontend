import Tooltip from './Tooltip.svelte';

export function tooltip(node: HTMLElement, title: string) {
  let tooltipComponent: Tooltip;

  const mouseenter = (event: MouseEvent) => {
    tooltipComponent = new Tooltip({
      props: {
        title,
        x: event.pageX,
        y: event.pageY,
      },
      target: document.body,
    });
    // set visibility asynchronously for a nice transition
    setTimeout(() => {
      tooltipComponent.$set({ visible: true });
    }, 240);
  };

  const mouseMove = (event: MouseEvent) => {
    tooltipComponent.$set({
      x: event.pageX,
      y: event.pageY,
    });
  };

  const mouseLeave = () => {
    tooltipComponent.$destroy();
  };

  node.addEventListener('mouseenter', mouseenter);
  node.addEventListener('mousemove', mouseMove);
  node.addEventListener('mouseleave', mouseLeave);
  return {
    destroy() {
      node.removeEventListener('mouseenter', mouseenter);
      node.removeEventListener('mousemove', mouseMove);
      node.removeEventListener('mouseleave', mouseLeave);
    },
  };
}
