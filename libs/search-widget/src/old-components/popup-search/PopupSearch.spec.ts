import PopupSearch from './PopupSearch.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { firstValueFrom, of } from 'rxjs';
import type { IResource, Search } from '@nuclia/core';
import { suggestionEnabled } from '../../core/stores/suggestions.store';
import { nucliaStore } from '../../core/old-stores/main.store';

jest.mock('../../core/api', () => {
  return {
    suggest: jest.fn((query) => {
      console.log(`mock suggest for query`, query);
      return of({
        paragraphs: { results: [{ text: 'Knowledge is power, France is bacon' } as Search.Paragraph], facets: {} },
      });
    }),
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
      const query = await firstValueFrom(nucliaStore().query);
      expect(query).toEqual('Who is Batman?');
    }
  });

  it('should display suggestions', async () => {
    const { container } = render(PopupSearch);
    suggestionEnabled.set(true);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who ' } });
      await fireEvent.keyPress(input, { key: 'Space' });
      expect(container.querySelector('.popup .modal')).toBeTruthy();
    }
  });

  it('should open modal on enter', async () => {
    nucliaStore().searchResults.next({
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
