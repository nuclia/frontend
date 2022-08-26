<script lang="ts">

  import type { Observable } from 'rxjs';
  import type { Resource, IResource } from '@nuclia/core';
  import { onMount } from 'svelte';
  import { switchMap } from 'rxjs/operators';
  import { nucliaState } from '../core/store';
  import { getResource } from '../core/api';
  import { of } from 'rxjs';

  export let result: IResource;
  let resource: Observable<Resource>;

  onMount(() => {
    resource = nucliaState().displayedResource.pipe(
      switchMap((resource) => !!resource?.uid ? getResource(resource.uid) : of(null)),
    );
  });
</script>

<div>TODO: video tile</div>

<style></style>
