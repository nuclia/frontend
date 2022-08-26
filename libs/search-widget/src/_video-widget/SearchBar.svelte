<svelte:options tag="nuclia-search-bar"/>

<script lang="ts">
  import type { KBStates } from '@nuclia/core';
  import { resetStore } from '../core/store';
  import { initNuclia, resetNuclia } from '../core/api';
  import { onMount } from 'svelte';
  import { setCDN, coerceBooleanProperty, loadCssAsText, loadFonts } from '../core/utils';
  import { setLang } from '../core/i18n';
  import SearchInput from '../widgets/search-input/SearchInput.svelte';
  import { setupSuggestionsAndPredictions, setupTriggerSearch } from '../core/search-bar';

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
        permalink: permalinkEnabled,
      },
      state,
    );
    if (cdn) {
      setCDN(cdn);
    }

    loadFonts();
    // Load CSS variables (must be done after the CDN was set) and custom styles
    loadCssAsText().subscribe((css) => cssVariables = css);

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupSuggestionsAndPredictions();
    setupTriggerSearch();

    ready = true;

    return () => {
      resetStore();
      resetNuclia();
    };
  });

</script>

<div style="{cssVariables}"
     data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    <SearchInput placeholder="{placeholder}" searchBarWidget="{true}"/>
  {/if}
</div>

<style>
</style>
