<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates } from '@nuclia/core';
  import { resetStore, nucliaStore } from '../../core/old-stores/main.store';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite, coerceBooleanProperty } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../old-components/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss';
  import { get_current_component } from 'svelte/internal';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
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
  export let filter = false;

  $: _filter = coerceBooleanProperty(filter);

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
      },
      state,
      {
        highlight: true,
      },
    );
    if (cdn) {
      setCDN(cdn);
    }

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);

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
    <SearchInput
      {placeholder}
      hasFilterButton={_filter}
      searchBarWidget={true} />
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
