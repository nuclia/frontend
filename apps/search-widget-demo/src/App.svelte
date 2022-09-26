<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/_video-widget';

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
  <header hidden="{!showConfiguration}">
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
        apikey="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InNhIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MTY5NTczMjM0NiwiaWF0IjoxNjY0MTk2MzQ2LCJzdWIiOiI1MTM5ZGY1YS1lYjIxLTQ2MGItOTgzZi1hOWM4YTJiN2UwNmYiLCJqdGkiOiI5ZDU0NmQ5Ni0wZmFiLTRhYjYtYmMxMy04NmFkZDMxMmQ5MzciLCJrZXkiOiI4OGYyYzJlOC0xYWM4LTQzM2QtOTc0OC03MTZmYTAzYmFlYzAiLCJraWQiOiI5MjhlOWJlNC03NDBiLTQ1ODgtYjBjMC04NTQxNzM5YWJiMmYifQ.W0EaIr3xppDsOX4ZCrH5-6ZNd5zn57RIuKvsK4iwtDhwUjixq5U1KKyio4bnK0RfaDD1QVWtk3e36kkOueKmVeCmeRAY_tg7KpA_y-GIORlfqq_6kQPm28zFBEpIVjHrJzWdQajllKLltnl7pZWTxPd3ClmZVMjX7ktCeI--6AZv0ci-bMzQv6jtnavp0DBIr9rpLeb4Z8kz1j347iMG_t6WC4yYcSlLJOnlOg20ZMEBTK-ly-SQgUVG3ySdBjAKcpl9nBG09FjA23wrubekzyFt3VQEJ-I_IyUZdiIOBo77qDA80T1y58V-Zn8AIgN93UQTrOgwUUMDj_Hnb5Eg1XSkPr8lUXSrczwfvrkFFijOaHdH-kglolVMQQIQQ64hPHgRqAvwhkTpIm36mHUUs43OouHrqtb9aWVhIysFOaBWtijuWLaJJGhKzrKfBv7cR40NFqbFON-9aJE7qVD9kinKrOxDwUAH7x2Hc_y3JeRmZwQgg604xVuu8-o4bgpHfu_bO4TabmNDDuNpILNfG69nYRXgp1wPmCiaL-jyiZXZ0XSnmQPkG9R9Jfwtz2GyKRlH8-Cx4eY43fO9JOF_rrlnNFjQ0m6jDhh_FVYw_rv7j0LJqp63CtB5koC6SC3dG_AdNusMMgoa8CP2GMHhrMhwpSnCWuBSYB4qoYHOT78"
        cdn="/"
        backend="https://stashify.cloud/api"
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
