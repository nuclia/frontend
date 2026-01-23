<svelte:options
  customElement={{
    tag: 'nuclia-arag-widget',
  }} />

<script lang="ts">
  import { Nuclia, type NucliaOptions } from '@nuclia/core';
  import { BehaviorSubject, filter, firstValueFrom, switchMap, take, tap } from 'rxjs';
  import { onMount } from 'svelte';
  import { Button, Icon, LoadingDots } from '../../common';
  import globalCss from '../../common/global.css?inline';
  import { ChatInput } from '../../components';
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
    triggerSearch,
    aragAnswerState,
    resetState,
    _,
    widgetFeatures,
  } from '../../core';
  import AragAnswer from '../../components/arag-answer/AragAnswer.svelte';

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
    session = 'ephemeral',
    lang = window.navigator.language.split('-')[0] || 'en',
    apikey,
    account = undefined,
    client = 'widget',
    fullscreen = false,
    height,
    mode = '',
  } = $props();

  const entries = $derived(aragAnswerState.entries);
  let entriesContainerElement: HTMLDivElement | undefined = $state();

  let darkMode = $derived(mode === 'dark');

  $effect(() => {
    if (entries.length > 0 && entriesContainerElement) {
      entriesContainerElement.scrollTo({
        top: (entriesContainerElement.lastElementChild as HTMLElement)?.offsetTop,
        behavior: 'smooth',
      });
    }
  });

  onMount(() => {
    if (!arag || !zone || !session) {
      console.error('Retrieval Agent id, session id and zone must be provided.');
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
    widgetFeatures.set({ hideThumbnails: true });

    const subscription = triggerSearch
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

    return () => {
      subscription.unsubscribe();
      resetState();
    };
  });

  function onInput(question: string) {
    searchQuery.set(question);
    triggerSearch.next();
  }
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  <style src="../../common/common-style.css"></style>
  {#if $ready && !!svgSprite}
    <div
      class="sw-chat"
      class:fullscreen>
      <div
        class="chat-container"
        class:fullscreen
        style={!fullscreen && height ? '--custom-height-container:' + height : undefined}>
        <div
          class="entries-container"
          class:hidden={entries.length === 0}
          bind:this={entriesContainerElement}>
          {#each entries as entry, i}
            <div class="chat-entry">
              <div
                class="question"
                class:error={!!entry.error}>
                <div class="chat-icon">
                  <Icon name="chat" />
                </div>
                <div class="title-m">{entry.question}</div>
              </div>
              <div class="answer">
                {#if entry.answers.length > 0 || entry.error}
                  <AragAnswer
                    expanded={i === entries.length - 1}
                    {entry} />
                {/if}
              </div>
            </div>
          {/each}
        </div>
        {#if getCurrentEntry()?.running}
          <LoadingDots />
        {/if}
        <div class="input-container">
          <ChatInput
            placeholder={$_('input.placeholder')}
            disabled={!!getCurrentEntry()?.running}
            {fullscreen}
            onChange={onInput} />
          <div class="reset-button">
            <Button
              aspect="basic"
              disabled={entries.length === 0}
              size="small"
              on:click={resetState}>
              {$_('answer.reset')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style src="./AragWidget.css"></style>
