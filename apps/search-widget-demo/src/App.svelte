<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src/widgets/search-widget';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';

  let selected = 'viewer';
  let showConfiguration = true;
  let widget: NucliaWidget;
  let viewerWidget: NucliaViewerWidget;
  let resource = '22452d0f0bb699abad6f73c4c9376c09';
  let kb = '0b445287-c465-412d-9630-8ae30c1668fc';

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
        knowledgebox={kb}
        cdn="/"
        apikey="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InNhIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MTcwMDE0NDY2MywiaWF0IjoxNjY4NjA4NjYzLCJzdWIiOiJmN2Q0OGVkZS00ZDI0LTQ2YzYtYTBlOS1hZGY2NGZiMDliMTQiLCJqdGkiOiJiZmI5ZTA0Mi0zOGVhLTRhY2UtOTI5ZC00ZGYyOGRiODU4YWUiLCJrZXkiOiJiMjI2ZDI3MC1kNjRhLTQ0MGEtYmQ4Yi1jMTMyYzRkNThhNWIiLCJraWQiOiJhNmQ2M2Y2ZS02N2EyLTRhZDYtOTkxNi05NDZhOWRiYzM4MDQifQ.CBY_QFyk7oY1npycm-A2zY-axicdeicXzVXHzvS4kx8p8K8R7op6ggzBugQll18jRuSdC6O94GYMWZzZ3XOv7nKd_3me1hW1Lb9uBeO-_PTGex1jjmVW5VE1VDleY8CtXXv7rUQ_I8FY5Sm83BQGl3ZX-vb4nY6HPvEE5WEXNJyMPA3a1-QC8zngkNqIfXSgj9_uFilJlgdLNAxGI9on_ponhXNFpbAV5Kku7fEzK9rnJbNPbrHEdg-QqZxadEXZ94JXfMdxSyOgxi1Lln2qvIsqCnzTKVsuSOeTfFnAXep44AkFp4T5U-HXjaj8KCwJVWw-clCUOQ_nfLVKIUNw9inPYL780EXhHrJtgoaXUItEzDZBA7j0unOYR0IkeP2gcZVvIAGHymIybtkGTp8SuVs4yTh7K7vPQ404vAJj_jv03TNdwuTYh1Z7qdfXzoXpuvWU4kVNS7DB8RXAw5BZWnscYhl9iFYUUUd6_xbkpMyW5XhxL1BQM-2PBK87mQJ__63PKxHGxTXbLvubbpvAjy56k6wtw9UNC3L4dKk9xBSqjKd4EAs0foq68TBBzZZOkpODP62xoR0lfJUDlouI_IV8fzRruhvYOniF0x5ZFWknbyCfQlVbn2g02_3SmeFtPKW2oqYJnHH7Mnl4_CdSBooHeWQoLv0sL_KNdBFOMnU"
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
