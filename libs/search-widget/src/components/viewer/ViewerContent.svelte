<script lang="ts">
  import { onDestroy } from "svelte";
  import { filter } from "rxjs";
  import { viewerData } from "../../core";

  const stateSubscription = viewerData.pipe(
    filter(state => !!state.currentResult?.fieldData)
  ).subscribe((value) => {
    console.log(`TODO viewer content with`, value);
  });

  onDestroy(() => {
    stateSubscription.unsubscribe();
  });
</script>
