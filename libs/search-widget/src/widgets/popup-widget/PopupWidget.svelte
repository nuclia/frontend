<svelte:options
  customElement={{
    tag: 'nuclia-popup',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import type { KBStates, Nuclia, Reranker, Widget } from '@nuclia/core';
  import { onMount } from 'svelte';
  import { getApiErrors, hasPermalinkToRender, isEmptySearchQuery, pendingResults, showResults } from '../../core';
  import SearchBar from '../search-widget/SearchBar.svelte';
  import SearchResults from '../search-widget/SearchResults.svelte';
  import { Observable } from 'rxjs';

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
    labelsets_excluded_from_filters?: string;
    preselected_filters?: string;
    filter_expression?: string;
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
    labelsets_excluded_from_filters = '',
    preselected_filters = '',
    filter_expression = '',
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
  let initHook: (n: Nuclia) => void = () => {};
  let initialized = false;

  export function search(query: string, filters?: string[], doNotTriggerSearch = false) {
    toggleSearchVisibility(true).subscribe(() =>
      searchBar?.onReady().then(() => searchBar?.search(query, filters, doNotTriggerSearch)),
    );
  }

  export function setInitHook(fn: (n: Nuclia) => void) {
    initHook = fn;
  }

  export const onError = getApiErrors();

  function enablePopupTrigger() {
    const searchButtons = document.querySelectorAll('[data-nuclia="search-widget-button"]');
    if (searchButtons.length > 0) {
      searchButtons.forEach((button) => button.addEventListener('click', toggleSearchVisibility));
      if (hasPermalinkToRender()) {
        toggleSearchVisibility(true);
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

  function toggleSearchVisibility(force = false): Observable<boolean> {
    visible = force || !visible;
    return new Observable((observer) => {
      if (visible && !initialized && initHook) {
        setTimeout(() => {
          searchBar?.setInitHook(initHook);
          searchBar?.onReady().then((res) => {
            initialized = true;
            observer.next(true);
            observer.complete();
          });
        }, 200);
      } else {
        observer.next(true);
        observer.complete();
      }
    });
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
  <style src="../../common/common-style.css"></style>
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
            {labelsets_excluded_from_filters}
            {preselected_filters}
            {filter_expression}
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

<style src="./PopupWidget.css"></style>
