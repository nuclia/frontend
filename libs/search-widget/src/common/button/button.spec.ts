import { mount, unmount } from 'svelte';
import { Button } from './';

describe('Button', () => {
  it('should render small button', () => {
    const component = mount(Button, {
      target: document.body,
      props: { size: 'small' },
    });
    expect(document.body.querySelector('button')?.classList.value).toContain('small');
    unmount(component);
  });
  it('should render solid button', () => {
    const component = mount(Button, {
      target: document.body,
      props: { aspect: 'solid' },
    });
    expect(document.body.querySelector('button')?.classList.value).toContain('solid');
    unmount(component);
  });
  it('should render basic button', () => {
    const component = mount(Button, {
      target: document.body,
      props: { aspect: 'basic' },
    });
    expect(document.body.querySelector('button')?.classList.value).toContain('basic');
    unmount(component);
  });
});
