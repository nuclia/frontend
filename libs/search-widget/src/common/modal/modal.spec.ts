import { Modal } from './';
import { mount, unmount } from 'svelte';
import { vi, it } from 'vitest';
describe('Modal', () => {
  it('should not render unless show is true', async () => {
    const component = mount(Modal, {
      target: document.body,
    });
    expect(document.body.querySelectorAll('dialog').length).toEqual(0);
    unmount(component);
  });

  it('should close on ESC', () => {
    const mock = vi.fn();
    const component = mount(Modal, {
      target: document.body,
      props: { show: true },
      events: { close: mock },
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(mock).toHaveBeenCalled();
    unmount(component);
  });

  it('should close on outside click', () => {
    const mock = vi.fn();
    const component = mount(Modal, {
      target: document.body,
      props: { show: true },
      events: { close: mock },
    });
    const elem = document.getElementsByClassName('sw-modal-backdrop')[0];
    elem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mock).toHaveBeenCalled();
    unmount(component);
  });

  it('should not close on inside click', () => {
    const mock = vi.fn();
    const component = mount(Modal, {
      target: document.body,
      props: { show: true },
      events: { close: mock },
    });
    const elem = document.getElementsByClassName('modal-content')[0];
    elem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mock).not.toHaveBeenCalled();
    unmount(component);
  });
});
