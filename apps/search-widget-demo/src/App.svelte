<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';
  const questions = [
    'Are beauty and utility incompatible?',
    'Is it fine to lie to people?',
    'Are we responsible for what we desire?',
    'Can we think without language?',
    'Is time real?',
  ];
  let widget: any;
</script>

<main>
  <ul>
    {#each questions as question}
      <li on:click|preventDefault|stopPropagation={() => widget.search(question)}>
        {question}
      </li>
    {/each}
  </ul>
  <div class="two-widgets-container">
    <NucliaSearchBar
      bind:this={widget}
      zone="europe-1"
      knowledgebox="f615c8ff-6ad3-42e0-9b24-ba6ae3b73cf3"
      cdn="/"
      lang="en"
      widgetid="dashboard"
      placeholder="Search"
      backend="http://localhost:8000/api"
      standalone="true"
    />
    <NucliaSearchResults />
  </div>
</main>

<style>
  li {
    cursor: pointer;
  }
  main {
    font-family: sans-serif;
    padding: 1em;
    max-width: 100%;
    margin: 0 auto;
    --custom-search-bar-max-width: 90vw;
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
