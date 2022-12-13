import EmbeddedSearch from './EmbeddedSearch.svelte';
import { render } from '@testing-library/svelte';
import { nucliaStore } from '../../core/old-stores/main.store';
import type { IResource, Search } from '@nuclia/core';
import { shouldEmitQuery } from '../search-input/SearchInput.spec';

describe('Embedded search', () => {
  it('should trigger search', async () => {
    const { container } = render(EmbeddedSearch);
    const input = container.querySelector('input');
    await shouldEmitQuery(input);
  });

  it('should display results', async () => {
    nucliaStore().searchResults.next({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
      fulltext: { results: [{ rid: 'res1', score: 1 } as Search.FulltextResource], facets: {} } as Search.Fulltext,
    });
    const { container } = render(EmbeddedSearch);
    expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
  });
});
