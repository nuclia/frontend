<svelte:options tag="nuclia-search" />

<script lang="ts">
  import PopupSearch from '../../old-components/popup-search/PopupSearch.svelte';
  import EmbeddedSearch from '../../old-components/embedded-search/EmbeddedSearch.svelte';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { get_current_component } from 'svelte/internal';
  import { setCDN, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import ViewerModal from '../../old-components/viewer/ViewerModal.svelte';
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss';
  import {
    setWidgetActions,
    widgetType,
    widgetMode,
    widgetFeatures,
    widgetPlaceholder,
    WidgetMode,
  } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initLabelStore,
    unsubscribeAllEffects,
  } from '../../core/stores/effects';
  import { isViewerOpen } from '../../core/stores/modal.store';
  import { initViewerEffects, unsubscribeViewerEffects } from '../../core/stores/viewer-effects';
  import { displayedResource } from '../../core/stores/search.store';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = '';
  export let knowledgebox = '';
  export let type = 'embedded'; // 'popup' | 'embedded'
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let standalone = false;
  export let features = '';

  let _features: WidgetFeatures = {};

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

  export const displayResource = (uid: string) => {
    if (uid) {
      displayedResource.set({ uid });
    } else {
      isViewerOpen.set(false);
    }
  };
  export const setActions = setWidgetActions;
  export const reset = () => {
    resetNuclia();
    unsubscribeAllEffects();
    unsubscribeViewerEffects();
  };

  let svgSprite;
  let ready = false;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }
    _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
      (acc, current) => ({ ...acc, [current as keyof WidgetFeatures]: true }),
      {},
    );
    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        account,
        standalone,
        public: !_features.notPublic && !apikey,
      },
      state,
      {
        highlight: true,
        features: _features,
      },
    );

    // Setup widget in the store
    widgetMode.set(type as WidgetMode);
    widgetFeatures.set(_features);
    if (placeholder) {
      widgetPlaceholder.set(placeholder);
    }
    if (_features.filter) {
      initLabelStore();
    }
    widgetType.set('search');

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    if (_features.suggestions) {
      activateTypeAheadSuggestions();
    }

    setupTriggerSearch(dispatchCustomEvent);
    if (_features.permalink) {
      activatePermalinks();
    }
    initViewerEffects(_features.permalink);

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    {#if type === 'popup'}
      <PopupSearch />
    {:else if type === 'embedded'}
      <EmbeddedSearch />
    {:else}
      {type} widget is not implemented yet
    {/if}
    <ViewerModal />
  {/if}

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./Widget.scss"></style>
