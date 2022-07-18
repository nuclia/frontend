<script lang="ts">
  import Button from '../components/button/Button.svelte';
  import Logo from '../components/logo/logo.svelte';
  import Modal from '../components/modal/Modal.svelte';
  import { nucliaState } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  import Suggestions from './suggestions/Suggestions.svelte';
  import { _ } from '../core/i18n';

  let showModal = false;
  let showResults = false;

  const openModal = (event: MouseEvent) => {
    event.preventDefault();
    showModal = true;
  };
  const paragraphs = nucliaState().paragraphs;
  const results = nucliaState().results;
</script>

<Button size="small" on:click={openModal}>
  <span class="text">{$_('button.label')}</span>
  <span class="logo"><Logo darkBackground={true} /></span>
</Button>

<Modal
  show={showModal}
  on:close={() => (showModal = false)}
  closeButton={true}
  backButton={showResults}
  on:back={() => {
    showResults = false;
  }}
>
    {#if !showResults}
      <div class="container">
        <div class="input">
          <SearchInput on:search={() => (showResults = true)} />
        </div>
        <div class="results suggestions" class:empty={$paragraphs.length === 0}>
          <Suggestions paragraphs={$paragraphs} />
        </div>
      </div>
    {:else}
      <div class="results" class:empty={$results.length === 0}>
        <Results results={$results} />
      </div>
    {/if}
</Modal>

<style>
  .text {
    font-weight: 300;
    padding-left: 4px;
  }
  .logo {
    line-height: 0;
    padding: 0 4px 0 6px;
  }
  .logo :global(svg) {
    height: 20px;
    width: auto;
  }
  .container {
    padding: 1em;
  }
  .input {
    padding: 0 10px;
  }
  .suggestions {
    width: 600px;
    max-width: 100vw;
  }
  .results {
    height: calc(100vh - 139px);
    width: 1005;
    max-width: 100vw;
  }
  .results.empty,
  .results:not(.suggestions) {
    background-color: transparent;
  }
  @media (min-width: 640px) {
    .results {
      width: calc(100vw - 100px);
      height: calc(90vh - 139px);
    }
  }
</style>
