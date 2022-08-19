<script lang="ts">
  import { _ } from '../../core/i18n';
  import { debounceTime, filter, merge, share, take } from 'rxjs';

  import { createEventDispatcher, onMount } from 'svelte';
  import SearchIcon from '../../components/icons/search.svelte';
  import { nucliaState, nucliaStore } from '../../core/store';
  import Spinner from '../../components/spinner/Spinner.svelte';
  export let inputWidget = false;
  export let formWidget = false;
  export let placeholder = '';

  const defaultPlaceholder = 'input.placeholder'

  let value = '';
  let previous = '';
  let element: HTMLInputElement;
  const dispatch = createEventDispatcher();
  const pendingSuggestions = nucliaState().pendingSuggestions.pipe(share());
  const isPending = merge(
    pendingSuggestions.pipe(filter((pending) => pending)),
    pendingSuggestions.pipe(
      filter((pending) => !pending),
      debounceTime(500),
    ),
  );

  onMount(() => {
    element.focus();
    nucliaState()
      .query.pipe(take(1))
      .subscribe((query) => {
        value = query;
      });
  });

  $: {
    if (value.trim() !== previous.trim()) {
      dispatch('typeahead', value);
    }
    previous = value;
    if (value !== undefined) {
      nucliaStore().query.next(value);
    }
  }

  const search = () => {
    nucliaStore().triggerSearch.next();
    dispatch('search', value);
  };

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
    }
  };
</script>

<form role="search" autocomplete="off" class="search-input" class:form-widget-container={formWidget}>
  <input
    bind:this={element}
    class="search-field"
    class:input-widget={inputWidget}
    class:form-widget={formWidget}
    name="nuclia-search-field"
    placeholder={$_(placeholder || defaultPlaceholder)}
    tabindex="0"
    autocomplete="off"
    autocorrect="off"
    autofill="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label="Search input"
    bind:value
    on:input
    on:keyup
    on:change
    on:keypress={onEnter}
    on:keydown
  />
  {#if inputWidget || formWidget}
    <div class="search-icon">
      {#if $isPending}
        <Spinner small />
      {:else}
        <SearchIcon
          on:click={search}
          on:keyup={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}
        />
      {/if}
    </div>
  {/if}
</form>

<style>
  form {
    position: relative;
  }
  form.form-widget-container {
    width: 448px;
  }
  input {
    font-size: calc(var(--font-size-base) * 1.5);
    font-weight: var(--font-weight-body);
    line-height: calc(var(--line-height-body) * 1.5);
    border: 0;
    font-family: inherit;
    outline: none;
    width: calc(100% - 2px);
    color: inherit;
    text-overflow: ellipsis;
    box-sizing: border-box;

    -webkit-appearance: none;
  }
  input::placeholder {
    color: var(--color-neutral-strong);
    transition: all 0s ease;
  }

  .form-widget {
    font-size: var(--font-size-base);
    line-height: var(--line-height-body);
    padding: var(--form-widget-padding);
    border-width: var(--form-widget-border-width);
    border-style: var(--form-widget-border-style);
    border-color: var(--form-widget-border-color);
    border-radius: var(--form-widget-border-radius);
  }

  .input-widget {
    font-size: var(--font-size-base);
    line-height: var(--line-height-body);
    padding: var(--input-widget-padding);
    border-width: var(--input-widget-border-width);
    border-style: var(--input-widget-border-style);
    border-color: var(--input-widget-border-color);
    border-radius: var(--input-widget-border-radius);
  }
  .input-widget:focus,
  .input-widget:active {
    border-style: var(--input-widget-border-style-stronger);
  }
  .input-widget::placeholder {
    color: var(--input-widget-placeholder-color);
  }
  .search-icon {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
  }
</style>
