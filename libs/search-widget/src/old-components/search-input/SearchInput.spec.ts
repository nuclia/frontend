import SearchInput from './SearchInput.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../../core/old-stores/main.store';
import { firstValueFrom } from 'rxjs';

describe('Search input', () => {
  it('should have focus', async () => {
    const { container } = render(SearchInput);
    expect(container.querySelector('input:focus')).toBeTruthy();
  });

  it('should emit query', async () => {
    const { container } = render(SearchInput);
    const searchInput = container.querySelector('input');
    expect(searchInput).toBeTruthy();
    if (searchInput) {
      await fireEvent.input(searchInput, { target: { value: 'Who is Batman?' } });
      await fireEvent.keyPress(searchInput, { key: 'Enter' });
      const query = await firstValueFrom(nucliaStore().query);
      expect(query).toEqual('Who is Batman?');
    }
  });
});
