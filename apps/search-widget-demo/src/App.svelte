<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src/widgets/search-widget';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';

  let selected = 'form';
  let showConfiguration = true;
  let widget: NucliaWidget;
  let viewerWidget: NucliaViewerWidget;
  let resource = 'fe5cc983ded4330f65ae992f58d85fcf';
  let kb = '295e9002-a277-4356-96a3-5fe0b08b8d79';

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
  <header hidden={!showConfiguration}>
    <h1>Welcome to Nuclia</h1>

    <section class="configuration">
      <label for="widget-select">Select the widget to demo:</label>
      <select
        id="widget-select"
        bind:value={selected}>
        <option value="input">Popup search</option>
        <option value="form">Embedded search</option>
        <option value="two-widgets">Search bar and result widgets</option>
        <option value="viewer">Viewer widget</option>
      </select>
      <button on:click={() => setLang('en')}>English</button>
      <button on:click={() => setLang('es')}>Español</button>
    </section>
  </header>

  {#if selected === 'input'}
    <h2>Input widget</h2>
    <div class="input-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox={kb}
        backend="https://stashify.cloud/api"
        cdn="/"
        widgetid="label-annotation"
        type="input"
        permalink
        lang="en"
        placeholder="Input placeholder is invisible" />
    </div>
  {/if}
  {#if selected === 'form'}
    <h2>
      Embedded widget <small>(formerly known as form widget)</small>
    </h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox={kb}
      backend="https://stashify.cloud/api"
      cdn="/"
      widgetid="dashboard"
      type="form"
      lang="en"
      placeholder="Here's the placeholder" />
  {/if}

  {#if selected === 'two-widgets'}
    <h2>Two widgets: search bar and video results</h2>
    <div class="two-widgets-container">
      <NucliaSearchBar
        zone="europe-1"
        knowledgebox={kb}
        backend="https://stashify.cloud/api"
        cdn="/"
        lang="en"
        widgetid="dashboard"
        placeholder="Search" />
      <NucliaSearchResults />
    </div>
  {/if}
  {#if selected === 'viewer'}
    <h2>Viewer widget</h2>
    <label>Resource id:</label>
    <input bind:value={resource} />
    <button on:click={() => viewerWidget.displayResource(resource)}>Show resource</button>
    <div class="viewer-widget">
      <NucliaViewerWidget
        bind:this={viewerWidget}
        zone="europe-1"
        knowledgebox="f67d94ee-bd5b-4044-8844-a291c2ac244c"
        cdn="/"
        backend="https://stashify.cloud/api"
        widgetid="label-annotation"
        permalink
        lang="en" />
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
