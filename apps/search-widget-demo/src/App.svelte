<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults, NucliaChat } from '../../../libs/search-widget/src/widgets';
  import { NucliaAragWidget } from '../../../libs/search-widget/src/widgets/arag-widget';

  const arag = 'f2c7d3d8-41da-46f9-968b-ef12b8981c11'; // agent007 in mat-tetsing, about lawyers, example question "Who is a good lawyer for commercial dispute?"
  // const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d'; // mat-testing
  // const session = 'da7bb69f67864275b8bd1e07f312957c';
  const session = 'ephemeral';
  // WARNING: don't commit API key
  const apikey = ''
  const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d';
  // const kb = 'c20b1516-d47a-4b36-9e89-7e0604ef49bb'; // eric2
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '16f09da3-6637-4e8a-963a-0a5c18f3eb3f'; // movies / knowledge graph
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = 'baa24d32-9240-4d90-bd00-2e6f25b13668'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  // const kb = 'f2c7d3d8-41da-46f9-968b-ef12b8981c11'; // Agentic RAG KB

  const backend = 'https://accounts.stashify.cloud/api';
  // const backend = 'https://accounts.progress.cloud/api';
  const askFeatures = 'answers,permalink,autocompleteFromNERs,citations,persistChatHistory';
  const findFeatures = 'filter,autofilter,permalink,hideThumbnails,autocompleteFromNERs,displayMetadata';
  const filters = 'labels,created,mime';
  const allFeatures =
    'filter,suggestions,permalink,zrelations,zknowledgeGraph,znavigateToLink,znavigateToFile,answers,citations,zhideResults,displayMetadata,hideThumbnails,znoBM25forChat';
  const jsonSchema = {
    name: 'book_ordering',
    description: 'Structured answer for a book to order',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the book' },
        author: { type: 'string', description: 'The author of the book' },
      },
      required: ['title', 'author'],
    },
  };
</script>

<main>
  <!-- <NucliaAragWidget
    {backend}
    {arag}
    lang="en"
    zone="europe-1"
    {apikey}
    {session}></NucliaAragWidget> -->
  <NucliaSearchBar
    zone="gcp-dev-1"
    backend="https://accounts.gcp-global-dev-1.nuclia.io/api"
    cdn="/"
    knowledgebox="cd0f8ae5-770d-4049-9d7b-356248093c8c"
    account="6e6ec183-1ca4-45d3-a641-d909d1178e86"
    lang="en"
    no_tracking
    {apikey}
    features="debug,answers,permalink,citations"
    agentic_config_id="my-perplexity-config"
    // agentic_transport="websocket"
  />
  <NucliaSearchResults no_tracking />
 

  <!-- <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    {apikey}
    features="debug,{askFeatures}"
    {filters}
    labelsets_excluded_from_filters="taste,kind"
    metadata="origin:created:date:Date de sortie" />
  <NucliaSearchResults no_tracking /> -->

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