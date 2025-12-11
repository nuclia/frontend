<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets';
  import '../../../libs/rao-widget/src';

  const arag = 'f1c0a434-4419-4816-a265-8b43505cbd3e'; // Agent dragon
  // const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d'; // mat-testing
  const session = 'da7bb69f67864275b8bd1e07f312957c';
  // WARNING: don't commit API key
  const apikey = '';
  // const kb = 'c20b1516-d47a-4b36-9e89-7e0604ef49bb'; // eric2
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '16f09da3-6637-4e8a-963a-0a5c18f3eb3f'; // movies / knowledge graph
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = 'baa24d32-9240-4d90-bd00-2e6f25b13668'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const account = '6787bcbe-cc1c-4134-85f6-324104d9e1a3'; // Chaz 2
  const kb = 'b4fe9f16-d6b9-444c-a60a-6c4ae8a29d45'; // Agentic RAG KB

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';
  const askFeatures = 'answers,permalink,autocompleteFromNERs,citations,persistChatHistory';
  const findFeatures = 'filter,autofilter,useSynonyms,permalink,hideThumbnails,autocompleteFromNERs,displayMetadata';
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
    {account}
    {apikey}
    {session}></NucliaAragWidget> -->
  <!-- <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={findFeatures}
    {filters}
    labelsets_excluded_from_filters="taste,kind"
    metadata="origin:created:date:Date de sortie" />
  <NucliaSearchResults no_tracking /> -->

  <progress-rao-widget
  backend={backend}
  account={account}
  aragid={kb}
  apikey={apikey}
  zone="europe-1"
  lang="en"
  title="Agentic RAG"
  username="Test"
  inputplaceholder="Ask Agentic RAG a question or make a request ..."
  viewtype="floating"
  >
</progress-rao-widget>

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