<script lang="ts">
  import { setLang } from '../../../libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/_video-widget';

  let selected = 'input';
  console.log(NucliaWidget, NucliaSearchBar, NucliaSearchResults);

  onMount(() => init());

  const getWidget = () => document.querySelector('nuclia-search') as NucliaWidget | null;

  const init = () => {
    const widget = getWidget();
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
          widget?.displayResource('');
        },
      },
    ]);
  };

  const selectWidget = (event: any) => {
    const widgetType = event?.target?.value;
    selected = widgetType;
    setTimeout(() => {
      init();
    }, 0);
  };
</script>

<main>
  <h1>Welcome to Nuclia</h1>

  <section class="configuration">
    <label for="widget-select">Select the widget to demo:</label>
    <select id="widget-select" on:change={selectWidget}>
      <option value="input" selected>Popup search</option>
      <option value="form">Embedded search</option>
      <option value="two-widgets">Search bar and result widgets</option>
    </select>
    <button on:click={() => setLang('en')}>English</button>
    <button on:click={() => setLang('es')}>Español</button>
  </section>

  {#if selected === 'input'}
    <h2>Input widget</h2>
    <div class="input-container">
      <nuclia-search
        data-zone="europe-1"
        data-knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
        data-cdn="/"
        data-widgetid="demo-input"
        data-type="input"
        data-permalink
        data-lang="en"
        data-placeholder="Input placeholder is invisible"
      />
    </div>
  {/if}
  {#if selected === 'form'}
    <h2>Embedded widget <small>(formerly known as form widget)</small></h2>
    <div>
      <nuclia-search
        data-zone="europe-1"
        data-knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
        data-cdn="/"
        data-widgetid="demo-form"
        data-type="form"
        data-lang="en"
        data-placeholder="Here's the placeholder"
      />
    </div>
  {/if}

  {#if selected === 'two-widgets'}
    <h2>Two widgets: search bar and video results</h2>
    <div class="two-widgets-container">
      <nuclia-search-bar
        data-zone="europe-1"
        data-knowledgebox="878d31cd-3943-45ea-927a-c7c987edf7da"
        data-cdn="/"
        data-lang="en"
        data-widgetid="demo-search-bar"
        data-placeholder="Search"
      />
      <nuclia-search-results />
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
