<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-widget';

  const kb = '1f4e4651-580c-40db-8d20-c8dfdfffa530'; // books
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = '096d9070-f7be-40c8-a24c-19c89072e3ff'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';
  const askFeatures = 'answers,permalink,autocompleteFromNERs,zcitations,relations';
  const findFeatures = 'filter,autofilter,useSynonyms,permalink,hideThumbnails,autocompleteFromNERs';
  const allFeatures =
    'filter,suggestions,permalink,zrelations,zknowledgeGraph,znavigateToLink,znavigateToFile,answers,citations,zhideResults,displayMetadata,hideThumbnails,znoBM25forChat';
</script>

<main>
  <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={askFeatures}
  />
  <NucliaSearchResults no_tracking />
</main>

<style lang="scss">
  @import '../../../libs/search-widget/src/common/global.scss';
  @import '../../../libs/search-widget/src/common/common-style.scss';

  main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 1rem;
  }
</style>
