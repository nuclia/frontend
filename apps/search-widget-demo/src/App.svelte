<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { onMount } from 'svelte';
  import { Button, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaWidget } from '../../../libs/search-widget/src/widgets/search-widget';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-video-widget';

  let selected = 'tiles';
  let showConfiguration = true;
  let widget: NucliaWidget;
  let searchBar: NucliaSearchBar;
  let viewerWidget: NucliaViewerWidget;
  let resource = 'fe5cc983ded4330f65ae992f58d85fcf';
  /**
   * Classifier_test kb (already trained, owned by Carmen): cbb4afd0-26e6-480a-a814-4e08398bdf3e
   * Kb with different kind of media (owned by Mat): 5c2bc432-a579-48cd-b408-4271e5e7a43c
   */
  let kb = '97c145a3-0810-4222-a627-f88f0fc94b77';
</script>

<main>
  <header hidden={!showConfiguration}>
    <h1>Philosophy StackExchange</h1>
  </header>

  <ul>
    <li on:click={() => searchBar.search('Can logic help to understand the world?')}>
      Can logic help to understand the world?
    </li>
    <li on:click={() => searchBar.search('Is beauty just a matter of taste?')}>Is beauty just a matter of taste?</li>
    <li on:click={() => searchBar.search('Are mathematics real or just fictive?')}>
      Are mathematics real or just fictive?
    </li>
    <li on:click={() => searchBar.search('Can we think without language?')}>Can we think without language?</li>
    <li on:click={() => searchBar.search('Is time real?')}>Is time real?</li>
  </ul>

  <div class="two-widgets-container">
    <NucliaSearchBar
      zone="europe-1"
      bind:this={searchBar}
      knowledgebox={kb}
      backend="http://127.0.0.1:8000/api"
      cdn="/"
      lang="en"
      placeholder="Search"
      standalone={true}
      features="" />
    <NucliaSearchResults />
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
  .inverted {
    background-color: var(--color-dark-stronger);
    padding: var(--rhythm-1);
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
