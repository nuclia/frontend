import SearchInput from './SearchInput.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../../core/store';
import { firstValueFrom } from 'rxjs';

describe('Search input', () => {
  it('should have focus', async () => {
    const { container } = render(SearchInput);
    expect(container.querySelector('input:focus')).toBeTruthy();
  });

  it('should emit query', async () => {
    const { container } = render(SearchInput);
    await fireEvent.input(container.querySelector('input'), { target: { value: 'Who is Batman?' } });
    const query = await firstValueFrom(nucliaStore().query);
    expect(query).toEqual('Who is Batman?');
  });
});
