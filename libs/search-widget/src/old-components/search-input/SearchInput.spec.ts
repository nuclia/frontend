import SearchInput from './SearchInput.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { firstValueFrom } from 'rxjs';
import { nucliaStore } from '../../core/old-stores/main.store';

export async function shouldEmitQuery(searchInput: HTMLInputElement | null) {
  expect(searchInput).toBeTruthy();
  if (searchInput) {
    await fireEvent.input(searchInput, { target: { value: 'Who is Batman?' } });
    await fireEvent.keyPress(searchInput, { key: 'Enter' });
    const query = await firstValueFrom(nucliaStore().query);
    expect(query).toEqual('Who is Batman?');
  }
}

describe('Search input', () => {
  it('should emit query', async () => {
    const { container } = render(SearchInput);
    const searchInput = container.querySelector('input');
    await shouldEmitQuery(searchInput);
  });
});
