<script lang="ts">
  import { IconButton } from '../../common';
  import { _, images, removeImage } from '../../core';
</script>

{#if $images.length > 0}
  <div class="images">
    {#each $images as b64Image, index}
      <div class="image-preview">
        <img
          src={'data:' + b64Image.content_type + ';base64,' + b64Image.b64encoded}
          alt="$_('input.image-preview')" />
        <div class="image-btn">
          <IconButton
            aspect="solid"
            icon="cross"
            ariaLabel={$_('input.clear')}
            size="small"
            on:click={() => removeImage(index)}
            on:enter={() => removeImage(index)} />
        </div>
      </div>
    {/each}
  </div>
{/if}

<style src="./InputImages.css"></style>
