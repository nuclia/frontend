<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { Button, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaSearchBar, NucliaSearchResults } from '../../../libs/search-widget/src/widgets/search-widget';

  let selected = 'tiles';
  let showConfiguration = true;
  let searchBar: NucliaSearchBar;
  let viewerWidget: NucliaViewerWidget;
  let resultsWidget: NucliaSearchResults;

  let resource = '20fd69d4b4dcdf0eb9e8c95dfff1ce6c';
  let fieldType = 'file';
  let fieldId = '20fd69d4b4dcdf0eb9e8c95dfff1ce6c';

  let kb = 'f9877aa1-dc54-4d85-94dd-b7791afc8024';
  const apiKey =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InNhIn0.eyJpc3MiOiJodHRwczovL251Y2xpYS5jbG91ZC8iLCJleHAiOjE3MTQzMTY1MjUsImlhdCI6MTY4MjY5NDEyNSwic3ViIjoiMzFhYTNjNTQtZDUzZi00NDEwLThiZDEtM2IxZDQxNWFhODA3IiwianRpIjoiODgzZjUxMTUtNzI0OS00OTg5LWIxYTMtMDI3NWE2ZTdjOTUyIiwia2V5IjoiMDMwYTRlZWUtNDJiYy00ZThmLTkzNzYtMjc2M2YxYWYwOThkIiwia2lkIjoiNWUxMGFmNTgtMGIzNi00ZGRhLWI5MDQtMmNhZjM0ODNlZmE3In0.f6rTpNz0pve0EpF0fzNGt-NzSE1YoDLSinncJqGH-M4KP3u4zixodNXCFErH2kpWn9L4zIxxeEd1Nt-Xsz-Pzr5IJT8alnWncfS7pWE72o8oYJ8MlCbeHQA6Zy4HOhoX4OPP79z9mPz9ijkCxJ2zhzhT_uKmJaFrP95YN8npA-TxeoVHgVuTF_Igw33xORIqIxMhsrxiQiqxZLH3mYVabAJUzxKmRwsbSyDOyRClxCroiFPeWAWEQ32pXmLqPXdnk5dFwWip0bpz_InunriRE4Njbpket78NG1AM3346YK58NCvyXxyyj2xajBtv1_Jfqn_8Ca7uQd0vCIeiWw-TL_g_d1e-oRGAnZnlSzKw2XdVwSN3lnIhds3lhHS5A1pAnId6uO83J2a5J7F2U-siZ20Fu_FNQKPUNPei8GtJoI4g2YasAAtGCFzs3Svk8wiIe4fQ1NIwwt3XNbnYvmjeHSeFsNsOZ9loS9P5RSvyMvV5AMeb1TuiDOtBuI-Xw2fyVKGkcqqFTbwoSiaFFLubZBsKZQopE6L4POyqnUhesngcgHjkxSqPoPOL9UYg7NY0SxBV-xafeJfA2zWFKQTElxriY5wx6Y_Mi9kuedqD244XxK_0RCF8YUJP-L1JXremfnTKDECEx4N9ZKzQgorkb1LIrH52u78VBk_8k0eI8Bk';

  // const backend = 'https://stashify.cloud/api';
  const backend = 'https://nuclia.cloud/api';
</script>

<main>
  <div class="two-widgets-container">
    <NucliaSearchBar
      zone="europe-1"
      {backend}
      cdn="/"
      bind:this={searchBar}
      knowledgebox={kb}
      apikey={apiKey}
      lang="en"
      placeholder="Search"
      features="filter,suggestions,permalink,relations,zanswers,zspeech" />
    <NucliaSearchResults bind:this={resultsWidget} />
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
