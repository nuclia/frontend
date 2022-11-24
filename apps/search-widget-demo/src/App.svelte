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
  /**
   * Classifier_test kb (already trained, owned by Carmen): cbb4afd0-26e6-480a-a814-4e08398bdf3e
   * Kb with PDF with page indicator returned by search (owned by Mat): d64d2048-8bd2-474a-9ef2-213f85e90025
   * Kb with PDF without page indicators (owned by Mat): 8f39fe4e-04e0-4767-bc83-69fc4c9c31c6
   * Kb with different kind of media (owned by Mat): f67d94ee-bd5b-4044-8844-a291c2ac244c
   */
  let kb = 'f67d94ee-bd5b-4044-8844-a291c2ac244c';

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
        filter
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
      cdn="https://cdn.stashify.cloud/"
      widgetid="dashboard"
      type="form"
      lang="en"
      filter
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
        placeholder="Search"
        filter />
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
        knowledgebox={kb}
        cdn="/"
        backend="https://stashify.cloud/api"
        widgetid="dashboard"
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
