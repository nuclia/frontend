<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { Button, Expander, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-widget';
  import type {  FieldFullId } from '@nuclia/core';
  import { Nuclia, Search } from '@nuclia/core';
  import { onMount } from 'svelte';

  let selected = 'tiles';
  let showConfiguration = true;
  let searchBar: NucliaSearchBar;
  let viewerWidget: NucliaViewerWidget;
  let resultsWidget: NucliaSearchResults;

  let viewerKb = '16375869-1037-460d-8648-b3ee9c9206c0';
  let resource = '553ee1f6168a3ebef66591e0006f3400';
  let fieldType = 'file';
  let fieldId = '553ee1f6168a3ebef66591e0006f3400';
  let placeholder = 'Search';

  // let kb = 'eed07421-dc96-4067-a73b-32c89eac0229'; // philo
  // let kb = 'd10ea56b-7af9-495d-860f-23b616a44f9a'; // eudald
  // let kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // let kb = '0b8017a4-083a-4c11-b400-5234fb0530cf'; // carmen
  // let kb = '6b9f8f55-a57f-4ed4-b60e-759da54281fd'; // Robin Hobb
  let kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // let kb = 'f5d0ec7f-9ac3-46a3-b284-a38d5333d9e6'; // le petit prince
  // let kb = '1154f6a1-af3c-4a19-9039-35466f024448'; // Knowledge graph (daria wiki + an article)
  // let kb = '096d9070-f7be-40c8-a24c-19c89072e3ff'; // e2e permanent
  // let kb = 'dba8dfe3-cbde-4aa6-9b90-57fdd2503672'; // conversations
  // let kb = '02701e7d-2e67-4671-9b63-6634328ba0d6'; // Q&A Nuclia

  // KB in prod
  // let kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // let kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';

  const prompt = 'You want people to eat watermelon. Answer the following question: {question}, and then recommend to eat some watermelon.';
  const preselectedFilters = '';
  // const preselectedFilters = '/classification.labels/artist/Mademoiselle K';

  function updatePlaceholder() {
    if (placeholder === 'Search') {
      placeholder = '';
    } else {
      placeholder = 'Search';
    }
  }

  onMount(() => {

    resultsWidget?.setViewerMenu([
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
    viewerWidget?.setViewerMenu([
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

    // const nuclia = new Nuclia({
    //   backend: 'https://nuclia.cloud/api',
    //   zone: 'europe-1',
    //   knowledgeBox: 'df8b4c24-2807-4888-ad6c-ae97357a638b',
    // });
    // nuclia.asyncKnowledgeBox
    //   .chat('What can I do with NucliaDB?', undefined, [Chat.Features.VECTORS, Chat.Features.PARAGRAPHS], undefined, (answer) =>
    //     console.log('callback:', answer),
    //   )
    //   .then();
    // nuclia.knowledgeBox.find('Mademoiselle K', [Search.Features.PARAGRAPH, Search.Features.VECTOR], {with_synonyms: true}).subscribe((result) => console.log(result));
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
      <button on:click={() => updatePlaceholder()}>Reset placeholder</button>
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
        on:search={(event) => console.log(`search triggered – query: "${event.detail}"`)}
        zone="europe-1"
        {backend}
        cdn="/"
        bind:this={searchBar}
        knowledgebox={kb}
        lang="en"
        {placeholder}
        preselected_filters={preselectedFilters}
        features="filter,suggestions,permalink,relations,knowledgeGraph,navigateToLink,ztargetNewTab,znavigateToFile,answers,hideSources,displayMetadata,hideThumbnails,znoBM25forChat" />
      <NucliaSearchResults bind:this={resultsWidget} />
    </div>
  {/if}
  {#if selected === 'viewer'}
    <h2>Viewer widget</h2>
    <label for="kb">Kb:</label>
    <input
      id="kb"
      bind:value={viewerKb} />

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
        knowledgebox={viewerKb}
        cdn="/"
        {backend}
        lang="en" />
    </div>
  {/if}

  <div class="nuclia-widget">
    <Expander>
      <h3 slot="header">Sistema in Svelte</h3>
      <div class="nuclia-widget">
        <h4>Buttons</h4>
        <h5 class="section-title">Primary</h5>
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

        <h5 class="section-title">Secondary</h5>
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

        <h4>Labels</h4>
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
    </Expander>
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

  @media (min-width: 640px) {
    .input-container {
      width: 300px;
    }

    main {
      max-width: none;
    }
  }
</style>
