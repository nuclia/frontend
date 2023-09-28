import { Button } from './';
import { render } from '@testing-library/svelte';

describe('Button', () => {
  it('should render small button', () => {
    const { getByRole } = render(Button, { props: { size: 'small' } });
    expect(getByRole('button').classList.value).toContain('small');
  });
  it('should render solid button', () => {
    const { getByRole } = render(Button, { props: { aspect: 'solid' } });
    expect(getByRole('button').classList.value).toContain('solid');
  });
  it('should render basic button', () => {
    const { getByRole } = render(Button, { props: { aspect: 'basic' } });
    expect(getByRole('button').classList.value).toContain('basic');
  });
});
