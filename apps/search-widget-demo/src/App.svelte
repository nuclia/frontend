<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults, NucliaChat } from '../../../libs/search-widget/src/widgets';
  import { NucliaAragWidget } from '../../../libs/search-widget/src/widgets/arag-widget';

  const arag = 'f2c7d3d8-41da-46f9-968b-ef12b8981c11'; // Agent dragon
  // const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d'; // mat-testing
  // const session = 'da7bb69f67864275b8bd1e07f312957c';
  const session = 'ephemeral';
  // WARNING: don't commit API key
  const apikey = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InNhIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2V1cm9wZS0xLnN0YXNoaWZ5LmNsb3VkLyIsImlhdCI6MTc2ODMyNDA5MCwic3ViIjoiZmZkNDA5OGMtZDllZS00OWJmLTlhYTAtM2YwZWY0NzIxMWIyIiwianRpIjoiNzhmMjZmMDAtMTg0ZC00Y2Q2LWI0MzQtYmM0MzJmNzI2ZTkzIiwiZXhwIjoxNzk5ODYwMDg5LCJrZXkiOiI2Y2Q4YmNlMS1mY2E1LTQ0YTYtYTE4ZC05M2U5YzNlMWY2YzAiLCJraWQiOiJkOGE4YjE5Ni0wYzBmLTQ4NjktYWNiNy1lZjE4YzYzNGMzNmUifQ.A-IPyso9E7kDqDqUxv2e7I5n0F5lHqK2oWUxlOFUASd8fXNwsbmG9NR0ZQEiWKK0TO3Qr9094rRA-SD-8n7HlX_M4uNs-d6ZQwqnEOSWOMHZvsupjGsTzFez1f7R-s31aU29r-1QNXH9dIOmL2EqNytKWh1OmWrIApGN2yrbURdfKZF2tnPa6bUybrFOYyCRL4NDve4hQhRFBXDRp8Eq4bEShoJomT447QHr-QEQbe5K8mXmwK1pA-SP4opvOIyK8JYIlP6CeVwQSWKII2zd_YQ3i-ofJylLgexwpJwykQqprmoyhrDS7PJXeDJnduqlxcXlPGN_LPTS1y3kXs1NyQTI_rjo7ZoX04PLrGEm3MU43-_dqGqASsL67lTPeZrYApLL7gSr5cTGMGMIjUTKzNB23HH3lI_xOL08DxRy2W7iicdaAeRrqE8pzRoD2S_EvnaxB8_CbUk4Dvmr6AYISh7uexHNqH0tiSotvgMklQS2sgQE-5Yu2DbacyUgbIq2N8MfoQE9ii363wS4eMBNo2xqHTbBibRfVSGt1Zx94Wn5svXiTcW6eoORovK1v1LMDU6e6-7OWwkmjh1yLvpKCbeOutQxjUetFjRBqct7JdS5iPSNbE8dv2ZKmeVAvsfD96T_rwX_Qpw79DkoyND_I8lK1hj-T8ZyyG_Zn2CtPH4';
  const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d';
  // const kb = 'c20b1516-d47a-4b36-9e89-7e0604ef49bb'; // eric2
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '16f09da3-6637-4e8a-963a-0a5c18f3eb3f'; // movies / knowledge graph
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = 'baa24d32-9240-4d90-bd00-2e6f25b13668'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  // const kb = 'f2c7d3d8-41da-46f9-968b-ef12b8981c11'; // Agentic RAG KB

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
  <NucliaAragWidget
    {backend}
    {arag}
    lang="en"
    zone="europe-1"
    {account}
    {apikey}
    {session}></NucliaAragWidget>
  <!-- <NucliaSearchBar
    zone="europe-1"
    {backend}
    cdn="/"
    knowledgebox={kb}
    lang="en"
    no_tracking
    features={askFeatures}
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