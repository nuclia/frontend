<svelte:options
  customElement={{
    tag: 'nuclia-popup',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import { onMount } from 'svelte';
  import SearchBar from '../search-widget/SearchBar.svelte';
  import SearchResults from '../search-widget/SearchResults.svelte';
  import {
    getApiErrors,
    isEmptySearchQuery,
    pendingResults,
    previewKey,
    showResults,
    hasPermalinkToRender,
  } from '../../core';
  import type { KBStates, Reranker, Widget } from '@nuclia/core';

  interface Props {
    backend?: string;
    zone?: string;
    knowledgebox: string;
    placeholder?: string;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client?: string;
    kbstate?: KBStates;
    features?: string;
    standalone?: boolean;
    proxy?: boolean;
    filters?: string;
    preselected_filters?: string;
    csspath?: string;
    prompt?: string;
    system_prompt?: string;
    rephrase_prompt?: string;
    generativemodel?: string;
    no_tracking?: boolean;
    rag_strategies?: string;
    rag_images_strategies?: string;
    not_enough_data_message?: string;
    ask_to_resource?: string;
    max_tokens?: number | undefined;
    max_output_tokens?: number | undefined;
    max_paragraphs?: number | undefined;
    query_prepend?: string;
    json_schema?: string;
    vectorset?: string;
    chat_placeholder?: string;
    audit_metadata?: string;
    reranker?: Reranker | undefined;
    citation_threshold?: number | string | undefined;
    rrf_boosting?: number | string | undefined;
    feedback?: Widget.WidgetFeedback;
    copy_disclaimer?: string | undefined;
    metadata?: string | undefined;
    widget_id?: string | undefined;
    search_config_id?: string | undefined;
    security_groups?: string | undefined;
  }

  let {
    backend = 'https://nuclia.cloud/api',
    zone = 'europe-1',
    knowledgebox,
    placeholder = '',
    lang = '',
    cdn = '',
    apikey = '',
    account = '',
    client = 'widget',
    kbstate = 'PUBLISHED',
    features = '',
    standalone = false,
    proxy = false,
    filters = '',
    preselected_filters = '',
    csspath = '',
    prompt = '',
    system_prompt = '',
    rephrase_prompt = '',
    generativemodel = '',
    no_tracking = false,
    rag_strategies = '',
    rag_images_strategies = '',
    not_enough_data_message = '',
    ask_to_resource = '',
    max_tokens = undefined,
    max_output_tokens = undefined,
    max_paragraphs = undefined,
    query_prepend = '',
    json_schema = '',
    vectorset = '',
    chat_placeholder = '',
    audit_metadata = '',
    reranker = undefined,
    citation_threshold = undefined,
    rrf_boosting = undefined,
    feedback = 'answer',
    copy_disclaimer = undefined,
    metadata = undefined,
    widget_id = undefined,
    search_config_id = undefined,
    security_groups = undefined,
  }: Props = $props();

  let searchBar: any = $state();
  let visible = $state(false);

  export function search(query: string, filters?: string[], doNotTriggerSearch = false) {
    visible = true;
    setTimeout(() => searchBar?.search(query, filters, doNotTriggerSearch), 0);
  }

  export const onError = getApiErrors();

  function enablePopupTrigger() {
    const searchButtons = document.querySelectorAll('[data-nuclia="search-widget-button"]');
    if (searchButtons.length > 0) {
      searchButtons.forEach((button) => button.addEventListener('click', toggleSearchVisibility));
      if (hasPermalinkToRender()) {
        visible = true;
      }
      return true;
    } else {
      return false;
    }
  }

  onMount(() => {
    const firstTry = enablePopupTrigger();
    if (!firstTry) {
      setTimeout(() => {
        const secondTry = enablePopupTrigger();
        if (!secondTry) {
          console.info(
            `No button found to open Nuclia’s search widget. Make sure you added 'data-nuclia="search-widget-button"' to a clickable element.`,
          );
        }
      }, 1000);
    }
  });

  function toggleSearchVisibility() {
    visible = !visible;
  }

  function onBackdropKeyup(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      toggleSearchVisibility();
    }
  }

  function onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      toggleSearchVisibility();
    }
  }
</script>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if visible}
    <div
      class="backdrop"
      onkeyup={onBackdropKeyup}
      onclick={onBackdropClick}>
      <div
        class="search-container"
        class:with-results={$showResults && !$isEmptySearchQuery}
        class:pending-results={$pendingResults}>
        <div class="search-bar-container">
          <SearchBar
            bind:this={searchBar}
            {backend}
            {zone}
            {knowledgebox}
            {placeholder}
            {lang}
            {cdn}
            {apikey}
            {account}
            {client}
            {kbstate}
            {features}
            {standalone}
            {proxy}
            {filters}
            {preselected_filters}
            {csspath}
            {prompt}
            {system_prompt}
            {rephrase_prompt}
            {generativemodel}
            {no_tracking}
            {rag_strategies}
            {rag_images_strategies}
            {not_enough_data_message}
            {ask_to_resource}
            {max_tokens}
            {max_output_tokens}
            {max_paragraphs}
            {query_prepend}
            {json_schema}
            {vectorset}
            {chat_placeholder}
            {audit_metadata}
            {reranker}
            {citation_threshold}
            {rrf_boosting}
            {feedback}
            {copy_disclaimer}
            {metadata}
            {widget_id}
            {search_config_id}
            {security_groups} />
        </div>
        <div class="search-results-container">
          <SearchResults />
        </div>
      </div>
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./PopupWidget.scss"></style>
