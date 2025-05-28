<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  interface Props {
    hasMore?: boolean;
    scrollableContainerSelector?: string;
  }

  let { hasMore = true, scrollableContainerSelector = '' }: Props = $props();

  const dispatch = createEventDispatcher();
  let mustLoadMore = false;
  let component: HTMLElement | undefined = $state(undefined);
  let scrollableContainer: HTMLElement | null;

  onMount(() => {
    if (scrollableContainerSelector) {
      scrollableContainer = document.querySelector(scrollableContainerSelector);
    }
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', onScroll);
    } else {
      document.addEventListener('scroll', onScroll);
    }
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
    if (scrollableContainer) {
      scrollableContainer.removeEventListener('scroll', onScroll, true);
    } else {
      document.removeEventListener('scroll', onScroll, true);
    }
    document.removeEventListener('resize', onScroll, true);
  });
</script>

<div
  bind:this={component}
  style="width:0px">
</div>
