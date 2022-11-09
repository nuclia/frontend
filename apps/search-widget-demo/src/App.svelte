<script lang="ts">
  import { NucliaWidget } from 'libs/search-widget/src/widgets/search-widget';

  let kb = '51f73384-ebc5-4f01-bbee-3f110bb52058';

  const questions = ['responding to a pandemic', 'solution for citizens'];
  let widget: any;
</script>

<main>
  <header>
    <h1>PloneConf videos</h1>
    <ul>
      {#each questions as question}
        <li on:click|preventDefault|stopPropagation={() => widget.search(question)}>
          {question}
        </li>
      {/each}
    </ul>
    <div class="two-widgets-container">
      <NucliaWidget
        bind:this={widget}
        zone="europe-1"
        knowledgebox={kb}
        cdn="/"
        lang="en"
        widgetid="dashboard"
        placeholder="Search Plone conference videos"
      />
    </div>
  </header>
</main>

<style>
  main {
    font-family: sans-serif;
    padding: 1em;
    max-width: 100%;
    margin: 0 auto;
  }

  li {
    cursor: pointer;
  }
  .two-widgets-container {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
