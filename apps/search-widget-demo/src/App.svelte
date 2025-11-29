<script lang="ts">
  import { NucliaAragWidget, NucliaSearchBar, NucliaSearchResults, ProgressSaoWidget } from '../../../libs/search-widget/src/widgets';

  // const arag = 'f1c0a434-4419-4816-a265-8b43505cbd3e'; // Agent dragon
  // const aragId = arag;
  // const account = 'fc1ebf90-632b-4ca5-a406-ca93ccf1920d'; // mat-testing
  // const account = '90288af7-5755-47bf-9700-d1ade78f7294'; // Chaz - Context Agent
  const account = '6787bcbe-cc1c-4134-85f6-324104d9e1a3'; // Chaz 2
  // const accountId = account;
  // const session = 'da7bb69f67864275b8bd1e07f312957c';
  // const session = 'ephemeral';
  // WARNING: don't commit API key
  const apiKey = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InNhIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2V1cm9wZS0xLnN0YXNoaWZ5LmNsb3VkLyIsImlhdCI6MTc2NDM3OTE1OSwic3ViIjoiMjBiYTA1N2EtNWZhYi00MzdlLThjYjctZjIzN2FjODdlZGYzIiwianRpIjoiZDU0MmU0ZTgtNTYxMS00M2MxLTk0YjktYWI3NzE0YThlZTdkIiwiZXhwIjoxNzk1OTE1MTU2LCJrZXkiOiI1ZGU2OTE2OS02ZGIxLTRhNGMtYjI1MC00MmZmYTJiODcyNzciLCJraWQiOiI5NTAxMzhjMi1kNzM5LTQ2OTUtOWU2Yy04YjNkYzk3NzZhMTIifQ.Hz0fyBELXj_e3ax9zjzsYn8IQA29GM9PpFFuzE_VeuY8eumtu9v_SvI1leTR1POhmXueIs9EACV0nbxhb3bu015CgEytWCjwGLEYMFjVJUMo1kOh5YZaufjyVvonoDqNlKk9hw2TRjQZRmXbVgDFmhHr7ruKH4WcIJNYTpm65OXruQzqfLaaMRcvkyP1Bw6bvNyxUw9zyDlkYxZc8M1W8AgFoCv4UmtfXzvLIt-LB0tI_A9mkvVTY8QKLSs5Yy0a5GR658pvPPy3gI7RRqQVVXAilaSoxqP5jndkLQ4AfOK2guGEyh7hX6stwbpRdFZ0biJIbqOyF53-Crdh8yH4Y4uSK5ExJq1UvEdPSa4wG_fcNqhdhfP3QmTuwynipfjkHvZiZZieFzrdUjtUDwoDzGm9fTSo4RkuV_R7Ni7cej5-wcP8h7SxVsOnwA7-xIZcFd-dPCdRwtxVZ-4AUnn8_UV-iUZRBZFLoki-Odb3DHrT-u8TDhAXd7sPUTaZ82GaMAam4zSGdPn4kycR_DwM0lCT0iT3hnxkTXuqrAJQrbhY3R9usEIWzZ_UJ0SUvBJA_i3MzpIpT-nx5TJ-gqGucA6cRDQjYcOH0kEqq9Lq-bPoP0fDf_ke65DneXA7aFhh75ujb-MjJXd4TcQ-7vSYMLyZU0lwn-ht75ZH_MNat34';
  // const kb = '2be414d6-7e7a-42be-8f31-a8a3b11022c8'; // Context Agent
  const kb = 'b4fe9f16-d6b9-444c-a60a-6c4ae8a29d45'; // 
  // const kb = 'c20b1516-d47a-4b36-9e89-7e0604ef49bb'; // eric2
  // const kb = '7527399e-b18f-4461-84a7-d92582d7b8c6'; // agentic-rag
  // const kb = '5fad8445-ff08-4428-85a4-3c6eeb9d2ece'; // chat
  // const kb = '16f09da3-6637-4e8a-963a-0a5c18f3eb3f'; // movies / knowledge graph
  // const kb = '5c2bc432-a579-48cd-b408-4271e5e7a43c'; // medias
  // const kb = 'baa24d32-9240-4d90-bd00-2e6f25b13668'; // e2e permanent

  // KB in prod
  // const kb = '16375869-1037-460d-8648-b3ee9c9206c0' // market outlook reports
  // const kb = 'df8b4c24-2807-4888-ad6c-ae97357a638b'; // nuclia docs

  const backend = 'https://stashify.cloud/api';
  // const backend = 'https://nuclia.cloud/api';
  // const askFeatures = 'answers,permalink,autocompleteFromNERs,citations,persistChatHistory';
  // const findFeatures = 'filter,autofilter,useSynonyms,permalink,hideThumbnails,autocompleteFromNERs,displayMetadata';
  // const filters = 'labels,created,mime';
  // const allFeatures =
  //   'filter,suggestions,permalink,zrelations,zknowledgeGraph,znavigateToLink,znavigateToFile,answers,citations,zhideResults,displayMetadata,hideThumbnails,znoBM25forChat';
  // const jsonSchema = {
  //   name: 'book_ordering',
  //   description: 'Structured answer for a book to order',
  //   parameters: {
  //     type: 'object',
  //     properties: {
  //       title: { type: 'string', description: 'The title of the book' },
  //       author: { type: 'string', description: 'The author of the book' },
  //     },
  //     required: ['title', 'author'],
  //   },
  // };
</script>

<main>
  <!-- <NucliaAragWidget
    {backend}
    {arag}
    lang="en"
    zone="europe-1"
    {account}
    apikey={apiKey}
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

  <ProgressSaoWidget 
    {backend}
    aragId={kb}
    lang="en"
    zone="europe-1"
    {account}
    {apiKey}

    cards={[]} 
    inputPlaceholder="Ask Agentic RAG a question or make a request ..." 
    title="Agentic RAG" 
    userName={"Test"} 
    viewType="floating"
  />

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
