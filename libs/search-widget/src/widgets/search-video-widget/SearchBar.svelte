<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates } from '@nuclia/core';
  import { resetStore, nucliaStore } from '../../core/old-stores/main.store';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../old-components/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss';
  import { get_current_component } from 'svelte/internal';
  import { WidgetFeatures } from '@nuclia/core';
  import { widgetFeatures, widgetMode, widgetPlaceholder } from '../../core/stores/widget.store';
  import { activatePermalinks, initLabelStore } from '../../core/stores/effects';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = '';
  export let knowledgebox = '';
  export let placeholder = '';
  export let lang = '';
  export let cdn;
  export let apikey;
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';

  let _features: WidgetFeatures = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
    (acc, current) => ({ ...acc, [current as keyof WidgetFeatures]: true }),
    {},
  );

  export const search = (query: string) => {
    nucliaStore().query.next(query);
    nucliaStore().triggerSearch.next();
  };

  const thisComponent = get_current_component();
  const dispatchCustomEvent = (name: string, detail: any) => {
    thisComponent.dispatchEvent &&
      thisComponent.dispatchEvent(
        new CustomEvent(name, {
          detail,
          composed: true,
        }),
      );
  };

  let svgSprite;
  let ready = false;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }
    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        account,
      },
      state,
      {
        highlight: true,
        features: _features,
      },
    );

    // Setup widget in the store
    widgetMode.set('embedded');
    widgetFeatures.set(_features);
    if (placeholder) {
      widgetPlaceholder.set(placeholder);
    }
    if (_features.filter) {
      initLabelStore();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);
    if (_features.permalink) {
      activatePermalinks();
    }

    ready = true;

    return () => {
      resetStore();
      resetNuclia();
    };
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    <SearchInput searchBarWidget={true} />
  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="../../common/common-style.scss"></style>
