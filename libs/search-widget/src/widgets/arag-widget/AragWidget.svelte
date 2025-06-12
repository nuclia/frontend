<svelte:options
  customElement={{
    tag: 'nuclia-arag-bar',
  }} />

<script lang="ts">
  import { Nuclia, type NucliaOptions } from '@nuclia/core';
  import { BehaviorSubject, filter, firstValueFrom, switchMap, take, tap } from 'rxjs';
  import { onMount } from 'svelte';
  import globalCss from '../../common/global.css?inline';
  import { SearchInput } from '../../components';
  import {
    addAragAnswer,
    getApiErrors,
    isEmptySearchQuery,
    loadFonts,
    loadSvgSprite,
    resetNuclia,
    searchQuery,
    setAragError,
    setAragQuestion,
    setLang,
    stopAgent,
    triggerSearch,
  } from '../../core';

  const _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  export const onError = getApiErrors();
  export const reset = () => resetNuclia();

  let nucliaAPI: Nuclia;
  let svgSprite: string = $state('');
  let {
    backend = 'https://nuclia.cloud/api',
    zone = 'europe-1',
    arag,
    session,
    lang,
    apikey,
    account,
    client = 'widget',
  } = $props();

  onMount(() => {
    if (!account || !arag || !zone || !session) {
      console.error('Account id, Retrieval Agent id, session id and zone must be provided.');
      return;
    }
    const nucliaOptions: NucliaOptions = {
      backend,
      zone,
      knowledgeBox: arag,
      client,
      account,
      accountId: account,
      apiKey: apikey,
    };
    nucliaAPI = new Nuclia(nucliaOptions);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    setLang(lang);

    triggerSearch
      .pipe(
        filter(() => !!session),
        switchMap(() =>
          isEmptySearchQuery.pipe(
            take(1),
            filter((isEmptySearchQuery) => !isEmptySearchQuery),
            switchMap(() => searchQuery.pipe(take(1))),
            tap((question) => setAragQuestion(question)),
            switchMap((question) => nucliaAPI.arag.interact(session, question)),
          ),
        ),
      )
      .subscribe({
        next: (data) => {
          if (data.type === 'answer') {
            addAragAnswer(data.answer);
          } else {
            setAragError(data);
          }
        },
        error: (error) =>
          setAragError({
            type: 'error',
            body: error,
            status: -1,
            detail: 'Unexpected error while interacting with the Retrieval Agent.',
          }),
      });

    _ready.next(true);
  });

  function stopInteraction() {
    if (nucliaAPI && session) {
      nucliaAPI.arag.stopInteraction(session);
      stopAgent();
    }
  }
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <div class="search-box">
      <SearchInput on:resetQuery={() => stopInteraction()} />
    </div>
  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style src="./AragWidget.css"></style>
