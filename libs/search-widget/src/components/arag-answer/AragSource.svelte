<script lang="ts">
  import { convertChunkToParagraph, type SourceChunk } from '../../core';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import Chip from '../../common/chip/Chip.svelte';
  import Icon from '../../common/icons/Icon.svelte';

  interface Props {
    source: SourceChunk;
  }

  let { source }: Props = $props();
  
  const paragraph = $derived(convertChunkToParagraph(source.value));
  const links = $derived(
    source.value.url.map((url) => ({
      url,
      domain: new URL(url).host
        .split('.')
        .filter((part) => part !== 'www')
        .join('.'),
    })),
  );

  const open = (url: string) => {
    window.open(url, 'blank', 'noreferrer');
  };
</script>

<div class="sw-arag-source">
  <ParagraphResult
    {paragraph}
    ellipsis={true}
    disabled={true}
    resultType="text"></ParagraphResult>
  <div class="links">
    {#each links as link}
      <Chip
        color="#f7f7f8"
        clickable
        on:click={() => open(link.url)}>
        <span class="link">
          <Icon
            name="link"
            size="small"></Icon>
          <span>{link.domain}</span>
        </span>
      </Chip>
    {/each}
  </div>
</div>

<style src="./AragSource.css"></style>
