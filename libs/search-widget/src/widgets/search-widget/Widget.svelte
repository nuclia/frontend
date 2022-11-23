<svelte:options tag="nuclia-search" />

<script lang="ts">
  import PopupSearch from '../../old-components/popup-search/PopupSearch.svelte';
  import EmbeddedSearch from '../../old-components/embedded-search/EmbeddedSearch.svelte';
  import { resetStore, setDisplayedResource } from '../../core/old-stores/main.store';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { get_current_component } from 'svelte/internal';
  import { setCDN, coerceBooleanProperty, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import ViewerModal from '../../old-components/viewer/ViewerModal.svelte';
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss';
  import { customStyle, setWidgetActions, widgetType, navigateToLink } from '../../core/stores/widget.store';
  import { activateTypeAheadSuggestions, unsubscribeAllEffects } from '../../core/stores/effects';
  import { isViewerOpen } from '../../core/stores/modal.store';
  import { initViewerEffects, unsubscribeViewerEffects } from '../../core/old-stores/viewer-effects';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
  export let zone = '';
  export let knowledgebox = '';
  export let type = 'input'; // input, form
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let permalink = false;
  export let standalone = false;
  export let navigatetolink = false;
  export let notpublic = false;
  export let defaultfeatures = '';

  let _permalink = coerceBooleanProperty(permalink);
  let _navigatetolink = coerceBooleanProperty(navigatetolink);
  let _notpublic = coerceBooleanProperty(notpublic);
  let _defaultfeatures: WidgetFeatures = (
    typeof defaultfeatures === 'string' ? defaultfeatures.split(',').filter((f) => !!f) : []
  ).reduce((acc, current) => ({ ...acc, [current as keyof WidgetFeatures]: true }), {});

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
      setDisplayedResource({ uid });
    } else {
      isViewerOpen.set(false);
    }
  };
  export const setActions = setWidgetActions;
  export const reset = () => {
    resetStore();
    resetNuclia();
    unsubscribeAllEffects();
    unsubscribeViewerEffects();
  };

  let svgSprite;
  let style: string;
  let ready = false;

  onMount(() => {
    initNuclia(
      widgetid,
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        account,
        standalone,
        public: !_notpublic && !apikey,
      },
      state,
      {
        highlight: true,
        defaultFeatures: _defaultfeatures,
      },
    );
    if (cdn) {
      setCDN(cdn);
    }
    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    // Load custom styles
    customStyle.subscribe((css) => (style = css));

    activateTypeAheadSuggestions();

    setupTriggerSearch(dispatchCustomEvent);
    initViewerEffects(_permalink);

    widgetType.set('search');
    navigateToLink.set(_navigatetolink);
    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  {style}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    {#if type === 'input'}
      <PopupSearch {placeholder} />
    {:else if type === 'form'}
      <EmbeddedSearch {placeholder} />
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
