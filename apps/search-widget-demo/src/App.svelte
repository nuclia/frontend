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

{#if selected === 'input'}
  <nav>
    <NucliaWidget
      bind:this={widget}
      zone="europe-1"
      knowledgebox="b199ca95-4619-4219-9fa4-8caafc36d40f"
      backend="https://stashify.cloud/api"
      cdn="/"
      widgetid="test1"
      type="input"
      permalink
      placeholder="Test"
    />
  </nav>
{/if}

<main>
  <h1>Welcome to Nuclia</h1>
  <select bind:value={selected}>
    <option value="input">Input</option>
    <option value="button">Button</option>
    <option value="form">Form</option>
  </select>
  <button on:click={() => setLang('en')}>English</button>
  <button on:click={() => setLang('es')}>Español</button>
  {#if selected === 'button'}
    <h2>Button widget</h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox="f694f1a4-d3f2-42f7-8642-b027bb9e54fe"
      backend="https://stashify.cloud/api"
      cdn="/"
      widgetid="test1"
    />
  {/if}
  {#if selected === 'form'}
    <h2>Form widget</h2>
    <NucliaWidget
      zone="europe-1"
      knowledgebox="f694f1a4-d3f2-42f7-8642-b027bb9e54fe"
      backend="https://stashify.cloud/api"
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
    nav {
      position: fixed;
      top: 0;
      right: 250px;
      width: 300px;
    }
    main {
      max-width: none;
    }
  }
</style>
