<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let hasMore = true;

  const dispatch = createEventDispatcher();
  let mustLoadMore = false;
  let component: HTMLElement | undefined = undefined;

  onMount(() => {
    document.addEventListener('scroll', onScroll);
    document.addEventListener('resize', onScroll);
  });

  const isInViewport = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  };

  const onScroll = () => {
    if (component && isInViewport(component)) {
      if (!mustLoadMore && hasMore) {
        dispatch('loadMore');
      }
      mustLoadMore = true;
    } else {
      mustLoadMore = false;
    }
  };

  onDestroy(() => {
    document.removeEventListener('scroll', onScroll, true);
    document.removeEventListener('resize', onScroll, true);
  });
</script>

<div
  bind:this={component}
  style="width:0px" />
