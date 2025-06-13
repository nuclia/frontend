<svelte:options
  customElement={{
    tag: 'nuclia-arag-widget',
  }} />

<script lang="ts">
  import { Nuclia, type AragAnswerContext, type NucliaOptions } from '@nuclia/core';
  import { BehaviorSubject, filter, firstValueFrom, switchMap, take, tap } from 'rxjs';
  import { onMount } from 'svelte';
  import { Expander, LoadingDots } from '../../common';
  import globalCss from '../../common/global.css?inline';
  import { SearchInput } from '../../components';
  import {
    addAragAnswer,
    aragAnswerState,
    fillState,
    getApiErrors,
    isEmptySearchQuery,
    loadFonts,
    loadSvgSprite,
    resetNuclia,
    resetState,
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
    }
    stopAgent();
  }

  const aragLastMessage = $derived(
    aragAnswerState.answers.length > 0 ? aragAnswerState.answers[aragAnswerState.answers.length - 1] : undefined,
  );
  const contextList = $derived.by<AragAnswerContext[]>(() => {
    console.log(`Answer list:`, $state.snapshot(aragAnswerState.answers));
    return aragAnswerState.answers
      .filter((message) => !!message.context)
      .map((message) => message.context as AragAnswerContext);
  });
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <div class="search-box">
      <button onclick={() => fillState()}>Run demo</button>
      <button onclick={() => resetState()}>Reset</button>
      <SearchInput on:resetQuery={() => stopInteraction()} />
      {#if aragAnswerState.running}
        <div class="loading-container"><LoadingDots small={true} /></div>
      {/if}
    </div>

    <div class="arag-results-container">
      {#if aragLastMessage?.answer}
        <strong>Answer:</strong>
        <blockquote>{aragLastMessage.answer}</blockquote>
      {/if}
      {#if aragAnswerState.error}
        Error: {aragAnswerState.error.detail}
      {/if}
      {#if aragAnswerState.running || aragLastMessage?.answer}
        <Expander expanded={!aragLastMessage?.answer}>
          {#snippet header()}
            <div class="title-s">Details</div>
          {/snippet}
          <p class="step">
            <strong>Running agent {aragLastMessage?.step?.module}:</strong>
            {aragLastMessage?.step?.title}…
          </p>

          {#each contextList as context}
            <div class="step">
              <p>
                <strong>Agent {context.agent} context:</strong>
              </p>
              <Expander expanded={false}>
                {#snippet header()}
                  {context.question}
                {/snippet}
                <ul>
                  <li>
                    <strong>Answer</strong>
                    : {context.answer}
                  </li>
                  <li>
                    <strong>Summary</strong>
                    : {context.summary}
                  </li>
                </ul>
              </Expander>
            </div>
          {/each}
        </Expander>
      {/if}
    </div>
  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style src="./AragWidget.css"></style>
