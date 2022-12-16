<script lang="ts">
  import { Resource, Search } from '@nuclia/core';
  import { Observable } from 'rxjs';
  import { PreviewKind, WidgetParagraph } from '../../core/models';
  import { getResource } from '../../core/api';
  import TextViewer from './TextViewer.svelte';
  import DocumentTile from '../base-tile/DocumentTile.svelte';
  import { getCDN } from '../../core/utils';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

  let selectedParagraph: WidgetParagraph | undefined;
  let resource$: Observable<Resource> = getResource(result.id);
</script>

<DocumentTile previewKind={PreviewKind.NONE}
              fallbackThumbnail={`${getCDN()}icons/text/plain.svg`}
              {result}
              resourceObs={resource$}
              on:selectParagraph={(event) => selectedParagraph = event.detail.paragraph}>
  <TextViewer
    resource={resource$}
    {selectedParagraph}/>
</DocumentTile>

