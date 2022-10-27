<svelte:options tag="nuclia-resource" />

<script lang="ts">
  import { resetStore, setDisplayedResource } from '../../core/old-stores/main.store';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, coerceBooleanProperty, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import ViewerModal from '../../old-components/viewer/ViewerModal.svelte';
  import type { KBStates } from '@nuclia/core';
  import globalCss from '../../common/_global.scss';
  import { customStyle, setWidgetActions, widgetType } from '../../core/stores/widget.store';
  import { unsubscribeAllEffects } from '../../core/stores/effects';
  import { isViewerOpen } from '../../core/stores/modal.store';

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
  let _notpublic = coerceBooleanProperty(notpublic);

  $: permalinkEnabled = coerceBooleanProperty(permalink);

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
    
    widgetType.set('resource');
    ready = true;

    return () => reset();
  });

</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div class="nuclia-widget" {style} data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    <ViewerModal {permalinkEnabled} />
  {/if}

  <div id="nuclia-glyphs-sprite" hidden>{@html svgSprite}</div>
</div>

<style lang="scss" src="./ResourceWidget.scss"></style>
