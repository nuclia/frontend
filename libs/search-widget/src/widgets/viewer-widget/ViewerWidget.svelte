<svelte:options tag="nuclia-viewer" />

<script lang="ts">
  import { resetStore, setDisplayedResource } from '../../core/old-stores/main.store';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, coerceBooleanProperty, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import ViewerModal from '../../old-components/viewer/ViewerModal.svelte';
  import type { KBStates } from '@nuclia/core';
  import globalCss from '../../common/_global.scss';
  import { setWidgetActions, widgetFeatures, widgetType } from '../../core/stores/widget.store';
  import { unsubscribeAllEffects } from '../../core/stores/effects';
  import { isViewerOpen } from '../../core/stores/modal.store';
  import { initViewerEffects, unsubscribeViewerEffects } from '../../core/old-stores/viewer-effects';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
  export let zone = '';
  export let knowledgebox = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let permalink = false;
  export let standalone = false;
  export let notpublic = false;
  let _permalink = coerceBooleanProperty(permalink);
  let _notpublic = coerceBooleanProperty(notpublic);

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
      },
    );
    if (cdn) {
      setCDN(cdn);
    }

    // Setup widget in the store
    widgetFeatures.set({
      permalink: _permalink,
      notPublic: _notpublic,
    });
    widgetType.set('viewer');

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    initViewerEffects(_permalink);

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
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
