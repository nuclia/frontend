<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { Button, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaWidget } from '../../../libs/search-widget/src/widgets/search-widget';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';

  let selected = 'tiles';
  let showConfiguration = true;
  let widget: NucliaWidget;
  let searchBar: NucliaSearchBar;
  let viewerWidget: NucliaViewerWidget;
  let resource = 'fe5cc983ded4330f65ae992f58d85fcf';
  /**
   * Classifier_test kb (already trained, owned by Carmen): cbb4afd0-26e6-480a-a814-4e08398bdf3e
   * Kb with different kind of media (owned by Mat): 5c2bc432-a579-48cd-b408-4271e5e7a43c
   */
  let kb = 'eda3f482-d432-4fac-913a-00f0a4696fd4'; // pdfs
  // let kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // let kb = 'f5d0ec7f-9ac3-46a3-b284-a38d5333d9e6'; // le petit prince
  // let kb = '49e0c43e-7beb-4418-94fa-ed90226f365c'; // la classe américaine
  // let kb = '89ffdada-58ee-4199-8303-ad1450de1cbe'; // word, excel, csv, images,…

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

    <h2>Widget</h2>

    <p>Current KB: {kb}</p>
    <section class="configuration">
      <label for="widget-select">Select the widget to demo:</label>
      <select
        id="widget-select"
        bind:value={selected}>
        <option value="popup">Popup search</option>
        <option value="embedded">Embedded search</option>
        <option value="tiles">Search bar and result widgets</option>
        <option value="viewer">Viewer widget</option>
      </select>
      <button on:click={() => setLang('en')}>English</button>
      <button on:click={() => setLang('es')}>Español</button>
    </section>
  </header>

  {#if selected === 'popup'}
    <h3>Input widget</h3>
    <div class="input-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox={kb}
        backend="https://stashify.cloud/api"
        cdn="/"
        type="popup"
        features="permalink,filter,suggestions"
        lang="en"
        placeholder="Input placeholder is invisible" />
    </div>
  {/if}
  {#if selected === 'embedded'}
    <h2>
      Embedded widget <small>(formerly known as form widget)</small>
    </h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox={kb}
      backend="https://stashify.cloud/api"
      cdn="https://cdn.stashify.cloud/"
      type="embedded"
      lang="en"
      features="permalink,filter,suggestions,entityAnnotation" />
  {/if}
  {#if selected === 'tiles'}
    <h2>Two widgets: search bar and video results</h2>
    <p>
      Click on this text to trigger the corresponding search:
      <span on:click={() => searchBar.search('test query')}>test query</span>
    </p>
    <div class="two-widgets-container">
      <NucliaSearchBar
        zone="europe-1"
        bind:this={searchBar}
        knowledgebox={kb}
        backend="https://stashify.cloud/api"
        cdn="/"
        lang="en"
        placeholder="Search"
        features="filter,suggestions,permalink" />
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
        permalink
        lang="en" />
    </div>
  {/if}

  <h2>Sistema in Svelte</h2>
  <div class="nuclia-widget">
    <h3>Buttons</h3>
    <h4 class="section-title">Primary</h4>
    <div>
      <div class="demo-container">
        <div class="buttons-block">
          <Button
            kind="primary"
            aspect="solid">
            Solid
          </Button>
          <IconButton
            icon="search"
            kind="primary"
            aspect="solid">
            Solid
          </IconButton>
        </div>

        <div class="buttons-block">
          <Button
            kind="primary"
            aspect="basic">
            Basic
          </Button>
          <IconButton
            icon="search"
            kind="primary"
            aspect="basic">
            Basic
          </IconButton>
        </div>
      </div>
    </div>

    <h4 class="section-title">Secondary</h4>
    <div>
      <div class="demo-container">
        <div class="buttons-block">
          <Button
            kind="secondary"
            aspect="solid">
            Solid
          </Button>
          <IconButton
            icon="search"
            kind="secondary"
            aspect="solid">
            Solid
          </IconButton>
        </div>
        <div class="buttons-block">
          <Button
            kind="secondary"
            aspect="basic">
            Basic
          </Button>
          <IconButton
            icon="search"
            kind="secondary"
            aspect="basic">
            Basic
          </IconButton>
        </div>
      </div>
    </div>

    <h4 class="section-title">Inverted</h4>
    <div class="inverted">
      <div class="demo-container">
        <div class="buttons-block">
          <Button
            kind="inverted"
            aspect="solid">
            Solid
          </Button>
          <IconButton
            icon="search"
            kind="inverted"
            aspect="solid">
            Solid
          </IconButton>
        </div>
        <div class="buttons-block">
          <Button
            kind="inverted"
            aspect="basic">
            Basic
          </Button>
          <IconButton
            icon="search"
            kind="inverted"
            aspect="basic">
            Basic
          </IconButton>
        </div>
      </div>
    </div>

    <h3>Labels</h3>
    <p>
      Examples working with kb <code>f67d94ee-bd5b-4044-8844-a291c2ac244c</code>
    </p>
    <p><strong>Default: not removable, not clickable</strong></p>
    <div class="demo-container">
      <Label label={{ labelset: 'artist', label: 'Queen' }} />
      <Label label={{ labelset: 'sentiment', label: 'positive' }} />
      <Label label={{ labelset: 'genre', label: 'Rock' }} />
    </div>
    <p><strong>Clickable</strong></p>
    <div class="demo-container">
      <Label
        clickable
        label={{ labelset: 'artist', label: 'Queen' }} />
      <Label
        clickable
        label={{ labelset: 'sentiment', label: 'positive' }} />
      <Label
        clickable
        label={{ labelset: 'genre', label: 'Rock' }} />
    </div>
    <p><strong>Removable</strong></p>
    <div class="demo-container">
      <Label
        removable
        label={{ labelset: 'artist', label: 'Queen' }} />
      <Label
        removable
        label={{ labelset: 'sentiment', label: 'positive' }} />
      <Label
        removable
        label={{ labelset: 'genre', label: 'Rock' }} />
    </div>
  </div>
</main>

<style lang="scss">
  @import '../../../libs/search-widget/src/common/global.scss';
  @import '../../../libs/search-widget/src/common/common-style.scss';
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

  .demo-container,
  .buttons-block {
    display: flex;
    gap: 16px;
  }
  .inverted {
    background-color: var(--color-dark-stronger);
    padding: var(--rhythm-1);
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
