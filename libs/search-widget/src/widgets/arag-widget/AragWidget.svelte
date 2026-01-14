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
    getCurrentEntry,
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
    backend = 'https://rag.progress.cloud/api',
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
    getCurrentEntry().answers?.length > 0 ? getCurrentEntry().answers[getCurrentEntry().answers.length - 1] : undefined,
  );
  const contextsAndSteps = $derived.by<{title: string, value: string, message: string}[]>(() => {
    return getCurrentEntry().answers
      .filter((message) => !!message.context || !!message.step)
      .map((message) => {
        if (message.context) {
          return {title: message.context.title || '', value: message.context.question || '', message: message.context.summary ? `Summary: ${message.context.summary}` : ''}
        } else {
          return {title: message.step?.title || '', value: message.step?.value || '', message: message.step?.reason ? `Reason: ${message.step.reason}` : ''}
        }
      });
  });
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  <style src="../../common/common-style.css"></style> 
  {#if $ready && !!svgSprite}
    <div class="search-box">
      <SearchInput on:resetQuery={() => stopInteraction()} />
      {#if getCurrentEntry().running}
        <div class="loading-container"><LoadingDots small={true} /></div>
      {/if}
    </div>

    <div class="arag-results-container">
      {#if aragLastMessage?.answer}
        <strong>Answer:</strong>
        <blockquote>{aragLastMessage.answer}</blockquote>
      {/if}
      {#if getCurrentEntry().error}
        Error: {getCurrentEntry().error?.detail}
      {/if}
      {#if getCurrentEntry().running || aragLastMessage?.answer}
        <Expander expanded={!aragLastMessage?.answer}>
          {#snippet header()}
            <div class="title-s">Details</div>
          {/snippet}
          {#if getCurrentEntry().running}
          <p class="step">
            <strong>Running agent {aragLastMessage?.step?.module}:</strong>
            {aragLastMessage?.step?.title}…
          </p>
          {/if}

          {#each contextsAndSteps as context}
            <div class="step">
              <Expander expanded={false}>
                {#snippet header()}
                  {context.title}
                {/snippet}
                <ul>
                  {#if context.question}
                  <li>
                    <strong>{context.question}</strong>
                  </li>
                  {/if}
                  {#if context.value}
                  <li>
                    {context.value}
                  </li>
                  {/if}
                  {#if context.message}
                  <li>
                    {context.message}
                  </li>
                  {/if}
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
