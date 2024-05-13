<script lang="ts">
  import { setLang } from 'libs/search-widget/src/core/i18n';
  import { Button, Expander, IconButton, Label } from '../../../libs/search-widget/src/common';
  import { NucliaViewerWidget } from '../../../libs/search-widget/src/widgets/viewer-widget';
  import { NucliaGlobalSearch } from '../../../libs/search-widget/src/widgets/search-widget';
  import type { FieldFullId } from '@nuclia/core';
  import { onMount } from 'svelte';
</script>

<button data-nuclia="global-search-button">open</button>

<NucliaGlobalSearch
  knowledgebox="9f61aab5-2102-4899-82eb-e741b275e37c"
  lang="en"
  placeholder="Ask something about Nuclia"
  features="suggestions,answers,hideSources,hideThumbnails"></NucliaGlobalSearch>
