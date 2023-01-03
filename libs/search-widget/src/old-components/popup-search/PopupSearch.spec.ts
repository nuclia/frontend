import PopupSearch from './PopupSearch.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { firstValueFrom, of } from 'rxjs';
import type { IResource, Search } from '@nuclia/core';
import { shouldEmitQuery } from '../search-input/SearchInput.spec';
import { searchQuery, searchResults } from '../../core/stores/search.store';

jest.mock('../../core/api', () => {
  return {
    suggest: jest.fn(() =>
      of({
        paragraphs: { results: [{ text: 'Knowledge is power, France is bacon' } as Search.Paragraph], facets: {} },
      }),
    ),
  };
});

describe('Popup search', () => {
  it('should trigger search', async () => {
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      await fireEvent.keyPress(input, { key: 'Enter' });
      const query = await firstValueFrom(searchQuery);
      expect(query).toEqual('Who is Batman?');
    }
  });

  it('should display suggestions', async () => {
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    await shouldEmitQuery(input);
  });

  it('should open modal on enter', async () => {
    searchResults.set({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
    });
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      await fireEvent.keyPress(input, { key: 'Enter' });
      expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
    }
  });
});
