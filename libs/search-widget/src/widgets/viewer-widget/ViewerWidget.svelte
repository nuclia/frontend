<svelte:options tag="nuclia-viewer" />

<script lang="ts">
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import ViewerModal from '../../old-components/viewer/ViewerModal.svelte';
  import type { KBStates } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { setWidgetActions, widgetFeatures, widgetType } from '../../core/stores/widget.store';
  import { unsubscribeAllEffects } from '../../core/stores/effects';
  import { isViewerOpen } from '../../core/stores/modal.store';
  import { initViewerEffects, unsubscribeViewerEffects } from '../../old-components/viewer/store/viewer-effects';
  import { WidgetFeatures } from '@nuclia/core';
  import { displayedResource } from '../../core/stores/search.store';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = '';
  export let knowledgebox = '';
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
      },
    );

    // Setup widget in the store
    widgetFeatures.set(_features);
    widgetType.set('viewer');

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    initViewerEffects(_features.permalink);

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite}
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
  src="./ViewerWidget.scss"></style>
