<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets';

  const arag = 'f1c0a434-4419-4816-a265-8b43505cbd3e'; // Agent dragon
  const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d'; // mat-testing
  const session = 'da7bb69f67864275b8bd1e07f312957c';
  // WARNING: don't commit API key
  const apikey = '';
  const kb = '1f4e4651-580c-40db-8d20-c8dfdfffa530'; // books
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '16f09da3-6637-4e8a-963a-0a5c18f3eb3f'; // movies / knowledge graph
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = '096d9070-f7be-40c8-a24c-19c89072e3ff'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';
  const askFeatures = 'answers,permalink,autocompleteFromNERs,citations,persistChatHistory';
  const findFeatures = 'filter,autofilter,useSynonyms,permalink,hideThumbnails,autocompleteFromNERs';
  const allFeatures =
    'filter,suggestions,permalink,zrelations,zknowledgeGraph,znavigateToLink,znavigateToFile,answers,citations,zhideResults,displayMetadata,hideThumbnails,znoBM25forChat';
</script>

<main>
  <!-- <NucliaAragWidget
    {backend}
    {arag}
    lang="en"
    zone="europe-1"
    {account}
    {apikey}
    {session}></NucliaAragWidget> -->
  <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={askFeatures} />
  <NucliaSearchResults no_tracking />

  <!-- <NucliaChat
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={askFeatures} /> -->

  <!-- <NucliaPopupWidget
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={askFeatures} />
  <div data-nuclia="search-widget-button">Click here to open the Nuclia search widget</div> -->
</main>

<style>
  @import '../../../libs/search-widget/src/common/global.css';
  @import '../../../libs/search-widget/src/common/common-style.css';

  main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 1rem;
  }
</style>
