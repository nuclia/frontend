import {
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  DEFAULT_RESULT_DISPLAY_CONFIG,
  DEFAULT_ROUTING_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  GenerativeProviders,
  Widget,
} from '@nuclia/core';
import { cloneDeep } from '@flaps/core';
import {
  DEFAULT_WIDGET_CONFIG,
  findLinkedWidget,
  isSameConfigurations,
  isSameWidgetConfiguration,
  normalizeSearchConfigurationForEditor,
  normalizeWidgetConfigurationForEditor,
} from './search-widget.models';

describe('search widget editor normalization', () => {
  const providers = {
    provider: {
      models: {
        supported: { features: { structured_output: true } },
        unsupported: { features: { structured_output: false } },
      },
    },
  } as GenerativeProviders;

  function standardConfig(overrides: Partial<Widget.TypedSearchConfiguration> = {}): Widget.TypedSearchConfiguration {
    return {
      type: 'config',
      id: 'test-config',
      searchMode: 'simple-rag',
      searchBox: { ...DEFAULT_SEARCH_BOX_CONFIG },
      generativeAnswer: { ...DEFAULT_GENERATIVE_ANSWER_CONFIG, generateAnswer: true },
      resultDisplay: { ...DEFAULT_RESULT_DISPLAY_CONFIG },
      routing: { ...DEFAULT_ROUTING_CONFIG },
      ...overrides,
    };
  }

  it('fills editor defaults without mutating the saved configuration', () => {
    const saved = standardConfig({
      searchBox: { ...DEFAULT_SEARCH_BOX_CONFIG, initialFilters: undefined },
    });
    const snapshot = cloneDeep(saved);

    const normalized = normalizeSearchConfigurationForEditor(saved, providers, 'supported');

    expect(saved).toEqual(snapshot);
    expect(normalized).not.toBe(saved);
    expect(normalized.type === 'config' && normalized.searchBox?.initialFilters).toBe('');
  });

  it('normalizes model compatibility into the baseline so loading does not look modified', () => {
    const saved = standardConfig({
      generativeAnswer: {
        ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
        generateAnswer: true,
        generativeModel: 'unsupported',
      },
      resultDisplay: {
        ...DEFAULT_RESULT_DISPLAY_CONFIG,
        jsonOutput: true,
        showResultType: 'citations',
      },
    });

    const baseline = normalizeSearchConfigurationForEditor(saved, providers, 'supported');
    const loadedDraft = normalizeSearchConfigurationForEditor(saved, providers, 'supported');

    expect(baseline.type === 'config' && baseline.resultDisplay?.jsonOutput).toBe(false);
    expect(isSameConfigurations(loadedDraft, baseline)).toBe(true);
  });

  it('infers and persists the effective mode for legacy configs before dirty comparison', () => {
    const legacyConfig = standardConfig({
      searchMode: undefined,
      generativeAnswer: {
        ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
        generateAnswer: true,
      },
    });

    const baseline = normalizeSearchConfigurationForEditor(legacyConfig, providers, 'supported');

    expect(baseline.type === 'config' && baseline.searchMode).toBe('simple-rag');
    expect(baseline.type === 'config' && baseline.generativeAnswer?.generateAnswer).toBe(true);
  });

  it('derives generateAnswer from the selected mode', () => {
    const inconsistentConfig = standardConfig({
      searchMode: 'search',
      generativeAnswer: {
        ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
        generateAnswer: true,
      },
    });

    const baseline = normalizeSearchConfigurationForEditor(inconsistentConfig, providers, 'supported');

    expect(baseline.type === 'config' && baseline.generativeAnswer?.generateAnswer).toBe(false);
  });

  it('keeps a genuine user change dirty and clears it when reverted to the normalized baseline', () => {
    const baseline = normalizeSearchConfigurationForEditor(standardConfig(), providers, 'supported');
    const draft = cloneDeep(baseline);

    if (draft.type === 'config' && draft.searchBox) {
      draft.searchBox.highlight = !draft.searchBox.highlight;
    }
    expect(isSameConfigurations(draft, baseline)).toBe(false);

    const reverted = cloneDeep(baseline);
    expect(isSameConfigurations(reverted, baseline)).toBe(true);
  });

  it('normalizes embed appearance constraints into both baseline and draft', () => {
    const saved: Widget.WidgetConfiguration = {
      ...DEFAULT_WIDGET_CONFIG,
      widgetMode: 'popup',
      darkMode: 'dark',
      persistChatHistory: true,
      openNewTab: true,
      speech: false,
      speechSynthesis: true,
    };

    const baseline = normalizeWidgetConfigurationForEditor(saved);
    const loadedDraft = normalizeWidgetConfigurationForEditor(saved);

    expect(baseline.darkMode).toBe('light');
    expect(baseline.persistChatHistory).toBe(false);
    expect(baseline.openNewTab).toBe(false);
    expect(baseline.speechSynthesis).toBe(false);
    expect(isSameWidgetConfiguration(loadedDraft, baseline)).toBe(true);
  });

  it('loads the exact embed selected when several embeds share a configuration', () => {
    const widgets = [
      {
        slug: 'page-embed',
        searchConfigId: 'shared-config',
        widgetConfig: { ...DEFAULT_WIDGET_CONFIG, widgetMode: 'page' },
      },
      {
        slug: 'chat-embed',
        searchConfigId: 'shared-config',
        widgetConfig: { ...DEFAULT_WIDGET_CONFIG, widgetMode: 'chat' },
      },
    ] as Widget.Widget[];

    expect(findLinkedWidget(widgets, 'shared-config', 'chat-embed')?.widgetConfig?.widgetMode).toBe('chat');
  });
});
