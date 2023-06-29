<svelte:options tag="nuclia-chat" />

<script lang="ts">
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import type { KBStates} from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { initAnswer, initUsageTracking, initViewer, resetStatesAndEffects } from '../../core/stores/effects';
  import Chat from '../../components/answer/Chat.svelte';

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

  export let fullscreen = false;
  export let height = '';

  let showChat = !fullscreen;

  export function openChat() {
    showChat = true;
  }

  export function closeChat() {
    showChat = false;
  }

  export const reset = () => {
    resetNuclia();
    resetStatesAndEffects();
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
        standalone,
      },
      state,
      {},
    );

    initAnswer();
    initViewer();
    initUsageTracking();

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite}
    <Chat
      show={showChat}
      {fullscreen}
      height={height || undefined}
      on:close={closeChat} />
  {/if}

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./ChatWidget.scss"></style>
