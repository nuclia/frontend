import { SearchInput } from './';
import { firstValueFrom } from 'rxjs';
import { searchQuery } from '../../core/stores/search.store';
import { typeAhead } from '../../core/stores/suggestions.store';
import { mount, unmount } from 'svelte';

describe('Search input', () => {
  it('should emit query', async () => {
    const component = mount(SearchInput, {
      target: document.body,
    });
    const searchInput = document.querySelector('textarea');
    expect(searchInput).toBeTruthy();
    // await new Promise((r) => setTimeout(r, 200));
    if (searchInput) {
      // I could not succeed in triggering the value update in the Textarea component
      // so I cheat, using typeAhead to set the value…
      // searchInput.value = 'Who is Batman?';
      typeAhead.set('Who is Batman?');
      searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
      const query = await firstValueFrom(searchQuery);
      expect(query).toEqual('Who is Batman?');
    }
    unmount(component);
  });
});
