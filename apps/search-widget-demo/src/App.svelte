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
        knowledgebox="7bc716b2-9ee0-4bc8-bff2-585a16171694"
        apikey="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InNhIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MTY5NjQ5NzA0MSwiaWF0IjoxNjY0OTYxMDQxLCJzdWIiOiI3ZTBjMTg0OS1kYmJjLTRlYWYtYjY1YS01NmI0OWJjZWMzMGYiLCJqdGkiOiIwY2I3MDhkZi1iNDNjLTRhNDEtOTJlNS0xNDE5NGE1OGMxZTgiLCJrZXkiOiIyYWM5NDYzMC02YWI5LTQwYzMtYmFiNS1mNDM4Y2FjMWI5YzUiLCJraWQiOiIxZWQ5NWMwNy0yZWQ2LTRmZTktYWFlMC1iM2E3ZWI3NTk5YzMifQ.aHCF-AmOcal_JzpUX1i-Koj2QaTNKset0mkxriJHTwGDvVaNSR7doB8hx38NdMWVPlufoDTi2ZN8l4L8yKl2DIVnqCOU6UjGwf_tGN87ZcLth5wV-MwFsK4uFvM1ltzbt9THE_cY2F7tdfIvX803QS_Qf5WjBEVBguwSsXYQTvBo7AEv-VZgdCR1dyaFeQBDiXgp7Cd9xErGibYlxwBfE9NEnwFW_PSM45lZOduH363PN2dpnA4vdjKsPM6D1HtnXIzQdzwdhP3kCOWR7_HyKImjwEUR9JcMRinazBL_lNTIRxorUSnsB1MCs7AjS8Hl3-jjcBmKY9QQ6lYjcWyaNTnLmcUSz9UGmEZDcHgfDgoLGiZsVr42xocqTNL2lihr_z6mKTsSEyeVuHdfcLw5ed_T4a39FosLo0QI0GTmQNNjAC4uLnGqR_QzPBsJ6WPcQIvPw1jRGSUQWR4RscLSHEe2uHU9syNnc2A95dgiqvDjDvNA77EZ6RxhkDv8FXfu1fGI5WhXLRCtWnqA5_6sc9zC5yFaWE9YaKtIlLp8mQ9fSLRO5OW3C6V2pKsFJGKCCmeD-9HxAiKHn5rcXLlLcjnnbm87V6-3YJGANrMDDSyGwdZ9OfC9JkhMrHfSftYfPvnK6rCZzkX2SFLkTRQ0wx9n9MGP0XZ1U9bzZBNGHw8"
        cdn="/"
        backend="https://stashify.cloud/api"
        widgetid="dashboard"
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
