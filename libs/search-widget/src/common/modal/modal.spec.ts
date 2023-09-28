import { Modal } from './';
import { fireEvent, render } from '@testing-library/svelte';

describe('Modal', () => {
  it('should not render unless show is true', async () => {
    const { queryAllByRole, getByRole, component } = render(Modal);
    expect(queryAllByRole('dialog').length).toEqual(0);
  });

  it('should close on ESC', async () => {
    const { component } = render(Modal, { show: true });
    const mock = vi.fn();
    component.$on('close', mock);
    fireEvent(
      global.window,
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );
    expect(mock).toHaveBeenCalled();
  });

  it('should close on outside click', () => {
    const { component, container } = render(Modal, { show: true });
    const mock = vi.fn();
    component.$on('close', mock);
    fireEvent.click(container.getElementsByClassName('sw-modal-backdrop')[0]);
    expect(mock).toHaveBeenCalled();
  });

  it('should not close on inside click', () => {
    const { component, container } = render(Modal, { show: true });
    const mock = vi.fn();
    component.$on('close', mock);
    fireEvent.click(container.getElementsByClassName('modal-content')[0]);
    expect(mock).not.toHaveBeenCalled();
  });
});
