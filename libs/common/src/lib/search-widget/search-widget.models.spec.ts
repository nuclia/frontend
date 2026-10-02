import { getFeatures, NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { DEFAULT_WIDGET_CONFIG } from './search-widget.models';

describe('Chat submit button configuration', () => {
  it('includes the opt-in variant in generated widget features', () => {
    const features = getFeatures(NUCLIA_STANDARD_SEARCH_CONFIG, {
      ...DEFAULT_WIDGET_CONFIG,
      widgetMode: 'chat',
      displaySearchButton: true,
      chatSubmitButton: true,
    }).split(',');

    expect(features).toContain('displaySearchButton');
    expect(features).toContain('chatSubmitButton');
  });

  it('does not enable the variant for existing widget configurations', () => {
    expect(getFeatures(NUCLIA_STANDARD_SEARCH_CONFIG, DEFAULT_WIDGET_CONFIG).split(',')).not.toContain(
      'chatSubmitButton',
    );
  });
});
