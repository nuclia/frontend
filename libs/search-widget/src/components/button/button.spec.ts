import Button from './Button.svelte';
import { render } from '@testing-library/svelte';

describe('Button', () => {
  it('should render small button', () => {
    const { getByRole } = render(Button, { props: { size: 'small' } });
    expect(getByRole('button').classList).toContain('small');
  });
  it('should render solid button', () => {
    const { getByRole } = render(Button, { props: { aspect: 'solid' } });
    expect(getByRole('button').classList).toContain('solid');
  });
  it('should render basic button', () => {
    const { getByRole } = render(Button, { props: { aspect: 'basic' } });
    expect(getByRole('button').classList).toContain('basic');
  });
});
