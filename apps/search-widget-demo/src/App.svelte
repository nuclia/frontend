<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/_video-widget';

  let selected = 'form';
  let widget: NucliaWidget;

  onMount(() => {
    widget?.setActions([
      {
        label: 'Delete',
        action: (uid: string) => {
          console.log('delete', uid);
        },
      },
      {
        label: 'Edit',
        action: (uid: string) => {
          console.log('edit', uid);
        },
      },
      {
        label: 'Close',
        action: () => {
          widget.displayResource('');
        },
      },
    ]);
  });
</script>

<main>
  <h1>Welcome to Nuclia</h1>

  <section class="configuration">
    <label for="widget-select">Select the widget to demo:</label>
    <select id="widget-select" bind:value={selected}>
      <option value="input">Popup search</option>
      <option value="form">Embedded search</option>
      <option value="two-widgets">Search bar and result widgets</option>
    </select>
    <button on:click={() => setLang('en')}>English</button>
    <button on:click={() => setLang('es')}>Español</button>
  </section>

  {#if selected === 'input'}
    <h2>Input widget</h2>
    <div class="input-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
        cdn="/"
        widgetid="demo-input"
        type="input"
        permalink
        lang="en"
        placeholder="Input placeholder is invisible"
      />
    </div>
  {/if}
  {#if selected === 'form'}
    <h2>Embedded widget <small>(formerly known as form widget)</small></h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
      cdn="/"
      widgetid="demo-form"
      type="form"
      lang="en"
      placeholder="Here's the placeholder"
    />
  {/if}

  {#if selected === 'two-widgets'}
    <h2>Two widgets: search bar and video results</h2>
    <div class="two-widgets-container">
      <NucliaSearchBar
        zone="europe-1"
        knowledgebox="878d31cd-3943-45ea-927a-c7c987edf7da"
        cdn="/"
        lang="en"
        widgetid="demo-search-bar"
        placeholder="Search"
      />
      <NucliaSearchResults />
    </div>
  {/if}
</main>

<style>
  main {
    font-family: sans-serif;
    padding: 1em;
    max-width: 100%;
    margin: 0 auto;
  }

  .configuration {
    margin-bottom: 48px;
  }

  .two-widgets-container {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  @media (min-width: 640px) {
    .input-container {
      width: 300px;
    }

    main {
      max-width: none;
    }
  }
</style>
