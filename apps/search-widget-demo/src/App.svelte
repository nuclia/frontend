<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';
</script>

<main>
  <div class="two-widgets-container">
    <NucliaSearchBar
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
  main {
    font-family: sans-serif;
    padding: 1em;
    max-width: 100%;
    margin: 0 auto;
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
