<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import css from './SearchBar.scss';
  import type { KBStates } from '@nuclia/core';
  import { resetStore } from '../core/store';
  import { initNuclia, resetNuclia } from '../core/api';
  import { onMount } from 'svelte';
  import { setCDN, coerceBooleanProperty, loadCssAsText, loadFonts, loadSvgSprite, injectStyle } from '../core/utils';
  import { setLang } from '../core/i18n';
  import SearchInput from '../widgets/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../core/search-bar';

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
  export let permalink = false;

  $: permalinkEnabled = coerceBooleanProperty(permalink);

  let cssVariables;
  let svgSprite;
  let ready = false;
  let elem: HTMLElement;

  onMount(() => {
    injectStyle(elem, css);
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
        permalink: permalinkEnabled,
        highlight: false,
      },
      state,
      true,
    );
    if (cdn) {
      setCDN(cdn);
    }

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    // Load CSS variables (must be done after the CDN was set) and custom styles
    loadCssAsText().subscribe((css) => (cssVariables = css));

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch();

    ready = true;

    return () => {
      resetStore();
      resetNuclia();
    };
  });
</script>

<div bind:this={elem} style={cssVariables} data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    <SearchInput {placeholder} searchBarWidget={true} />
  {/if}
  <div id="nuclia-glyphs-sprite" hidden>{svgSprite}</div>
</div>
