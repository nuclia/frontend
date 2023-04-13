<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { Button, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-widget';
  import type { FieldFullId } from '@nuclia/core';
  import { onMount } from 'svelte';

  let selected = 'tiles';
  let showConfiguration = true;
  let searchBar: NucliaSearchBar;
  let viewerWidget: NucliaViewerWidget;
  let resultsWidget: NucliaSearchResults;

  let resource = '20fd69d4b4dcdf0eb9e8c95dfff1ce6c';
  let fieldType = 'file';
  let fieldId = '20fd69d4b4dcdf0eb9e8c95dfff1ce6c';

  // let kb = 'eed07421-dc96-4067-a73b-32c89eac0229'; // philo
  // let kb = 'd10ea56b-7af9-495d-860f-23b616a44f9a'; // eudald
  // let kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // let kb = '0b8017a4-083a-4c11-b400-5234fb0530cf'; // carmen
  // let kb = '6b9f8f55-a57f-4ed4-b60e-759da54281fd'; // Robin Hobb
  // let kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // let kb = 'f5d0ec7f-9ac3-46a3-b284-a38d5333d9e6'; // le petit prince
  let kb = '89ffdada-58ee-4199-8303-ad1450de1cbe'; // multiple types
  // let kb = '096d9070-f7be-40c8-a24c-19c89072e3ff'; // e2e permanent

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';

  onMount(() => {
    resultsWidget?.setTileMenu([
      {
        label: 'Delete',
        action: (fullId: FieldFullId) => {
          console.log('delete', fullId);
        },
      },
      {
        label: 'Edit',
        action: (fullId: FieldFullId) => {
          console.log('edit', fullId);
        },
      },
    ]);
    viewerWidget?.setTileMenu([
      {
        label: 'Delete',
        action: (fullId: FieldFullId) => {
          console.log('delete', fullId);
        },
      },
      {
        label: 'Edit',
        action: (fullId: FieldFullId) => {
          console.log('edit', fullId);
        },
      },
      {
        label: 'Close',
        action: () => {
          viewerWidget.closePreview();
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
        <option value="tiles">Search bar and result widgets</option>
        <option value="viewer">Viewer widget</option>
      </select>
      <button on:click={() => setLang('en')}>English</button>
      <button on:click={() => setLang('es')}>Español</button>
    </section>
  </header>

  {#if selected === 'tiles'}
    <h2>Two widgets: search bar and video results</h2>
    <p>
      Click on this text to trigger the corresponding search:
      <span on:click={() => searchBar.search('test query')}>test query</span>
    </p>
    <div class="two-widgets-container">
      <NucliaSearchBar
        zone="europe-1"
        {backend}
        cdn="/"
        bind:this={searchBar}
        knowledgebox={kb}
        lang="en"
        placeholder="Search"
        features="filter,suggestions,permalink,relations,zanswers,zspeech" />
      <NucliaSearchResults bind:this={resultsWidget} />
    </div>
  {/if}
  {#if selected === 'viewer'}
    <h2>Viewer widget</h2>
    <label for="rid">Resource id:</label>
    <input
      id="rid"
      bind:value={resource} />

    <label for="fid">Field id:</label>
    <input
      id="fid"
      bind:value={fieldId} />

    <label for="ftype">Field type:</label>
    <input
      id="ftype"
      bind:value={fieldType} />

    <button
      on:click={() => viewerWidget.openPreview({ resourceId: resource, field_type: fieldType, field_id: fieldId })}>
      Preview
    </button>
    <div class="viewer-widget">
      <NucliaViewerWidget
        bind:this={viewerWidget}
        zone="europe-1"
        knowledgebox={kb}
        cdn="/"
        {backend}
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
