<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { NucliaWidget } from '../../../libs/search-widget/src';

  let selected = 'input';
  let widget: NucliaWidget;

  onMount(() => {
    widget.setActions([
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
  <h1>Welcome to Nuclia</h1>
  <select bind:value={selected}>
    <option value="input">Input</option>
    <option value="form">Form</option>
  </select>
  <button on:click={() => setLang('en')}>English</button>
  <button on:click={() => setLang('es')}>Español</button>
  {#if selected === 'input'}
    <h2>Input widget</h2>
    <div class="input-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
        backend="https://stashify.cloud/api"
        cdn="/"
        widgetid="test1"
        type="input"
        permalink
        placeholder="Test"
      />
    </div>
  {/if}
  {#if selected === 'form'}
    <h2>Form widget</h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox="4088b21c-5aa0-4d5a-85a6-03448e52b031"
      cdn="/"
      widgetid="test1"
      type="form"
    />
  {/if}
</main>

<style>
  main {
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
  /* customize style here */
  /* :global(.nuclia-widget) {
    --custom-color-primary-regular: green;
    --custom-color-light-stronger: pink;
    --custom-font-size-base: 30px;
  } */

  @media (min-width: 640px) {
    .input-container {
      width: 300px;
    }
    main {
      max-width: none;
    }
  }
</style>
