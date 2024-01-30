<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-widget';

  const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = '096d9070-f7be-40c8-a24c-19c89072e3ff'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';
</script>

<main>
  <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features="filter,suggestions,permalink,relations,knowledgeGraph,znavigateToLink,znavigateToFile,zanswers,citations,zhideResults,displayMetadata,hideThumbnails,znoBM25forChat" />
  <NucliaSearchResults no_tracking />
</main>

<style lang="scss">
  @import '../../../libs/search-widget/src/common/global.scss';
  @import '../../../libs/search-widget/src/common/common-style.scss';
  main {
    padding: 1rem;
  }
</style>
