import SearchInput from './SearchInput.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../../core/stores/main.store';
import { firstValueFrom } from 'rxjs';

describe('Search input', () => {
  it('should have focus', async () => {
    const { container } = render(SearchInput);
    expect(container.querySelector('input:focus')).toBeTruthy();
  });

  it('should emit query', async () => {
    const { container } = render(SearchInput);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      const query = await firstValueFrom(nucliaStore().query);
      expect(query).toEqual('Who is Batman?');
    }
  });
});
