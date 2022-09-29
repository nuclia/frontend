import Tooltip from './Tooltip.svelte';
import { Duration } from '../transition.utils';

export function tooltip(node: HTMLElement, params: { title: string; type?: 'action' | 'system' }) {
  let tooltipComponent: Tooltip;
  const type: 'action' | 'system' = params.type || 'action';

  const getActionPosition = (): { x: number; y: number } => {
    return {
      x: node.offsetLeft,
      y: node.offsetTop + node.offsetHeight + 4,
    };
  };

  const getSystemPosition = (event: MouseEvent): { x: number; y: number } => {
    return {
      x: event.pageX + 16,
      y: event.pageY + 16,
    };
  };

  const mouseEnter = (event: MouseEvent) => {
    const position = type === 'action' ? getActionPosition() : getSystemPosition(event);
    tooltipComponent = new Tooltip({
      props: {
        ...position,
        title: params.title,
        visible: false,
      },
      target: document.body,
    });
    // set visibility asynchronously for a nice transition
    setTimeout(() => {
      tooltipComponent.$set({ visible: true });
    }, Duration.FAST);
  };

  const mouseMove = (event: MouseEvent) => {
    const position = getSystemPosition(event);
    tooltipComponent.$set({
      ...position,
    });
  };

  const mouseLeave = () => {
    tooltipComponent.$set({ visible: false });
    setTimeout(() => tooltipComponent.$destroy(), Duration.FAST);
  };

  node.addEventListener('mouseenter', mouseEnter);
  node.addEventListener('mouseleave', mouseLeave);

  if (type === 'system') {
    node.addEventListener('mousemove', mouseMove);
  }
  return {
    destroy() {
      node.removeEventListener('mouseenter', mouseEnter);
      node.removeEventListener('mouseleave', mouseLeave);
      if (type === 'system') {
        node.removeEventListener('mousemove', mouseMove);
      }
    },
  };
}
