<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src/widgets/search-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';

  let selected = 'input';
  let showConfiguration = true;
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
  <header hidden={!showConfiguration}>
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
  </header>

  {#if selected === 'input'}
    <h2>Input widget</h2>
    <div class="input-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox="f67d94ee-bd5b-4044-8844-a291c2ac244c"
        apikey="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InNhIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MTY5NjU4MTY4MiwiaWF0IjoxNjY1MDQ1NjgyLCJzdWIiOiI1MTM5ZGY1YS1lYjIxLTQ2MGItOTgzZi1hOWM4YTJiN2UwNmYiLCJqdGkiOiJhNDY0MTU3Yi05MTQyLTQxMmEtYjc2Yy1hY2EwNDhjMWY3NWIiLCJrZXkiOiI1NWE4NDNmMy03ZTU2LTRjMjYtYWU3Yi1mNGI2YjM2OTdkMGEiLCJraWQiOiIwNDA4MzFjNC04ODlmLTQ0M2EtOTI1Zi03MDI2Y2NjNGRiZTcifQ.qUDdb-a4Lv2t6ruO48x9YQqLFgUa8JeUXz5AxDmhz09ut6BGfY-rx7C5QnUcXJx6LWRFhQ5g3tTkJCRg7wrMsq4zehTyJZo4o6JdYnnVUcHgsmsh3h563ojQ8tEyn6xedzdvy5j84hXnhuFhb_k_BWwUzXUGZWEw5koBbROsrUEdudStWhdN8d1NdXGpTJ2uq-dmkofA3iVnSZNZerCQRCim3JGraUDzidvTQW1wyzBm7b1-CnJEJy9F0kjc6nNm1FA5r0958HF-Jv9PpIT0z7YcOVOayVHUc58iSEQjbubXoRXo0vycuYzSUXqs8sJLxgZYTVCRs8Y3FoLReHoYo7nnlupaKujrcZujO4vROOsZL6hGCmZdXibQ3Qc2O3RJaEEtzy7iL-uf9gexw47DymHk7erqCxB_5HQDuh9nAJBgZWK4mr3nfOxmTkAyG5c0sooUogunSYfR5xwq9KD_aSmKGqGzaNWUTJb7uFhbFRpnYczGr5lhoToQKp9T3W7_Psc_TiUeRiLMYVDNFSjM77N7AxcJ0wDx9We1F_qmex8_7Z7-9FJmRrOKi4TQrITEo-JZq59OBE314GEDGGmAoN92yjm9appmRo4w2PLTGmWc2ZxKHdWgvU-Vj4YKPl9Nl6a7CnO4mrM__tsQbLK0ZwToZF60Hq6-sPC6e5Jjq-c"
        cdn="/"
        backend="https://stashify.cloud/api"
        widgetid="label-annotation"
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
        knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
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
