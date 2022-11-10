<script lang="ts">
  import { formatDate, getCDN } from '../../core/utils';
  import MimeIcon from '../../common/icons/MimeIcon.svelte';
  import ActionMenu from './menus/ActionMenu.svelte';
  import { resource } from '../../core/stores/resource.store';
  import { getWidgetActions } from '../../core/stores/widget.store';

  let showMetadata = false;
</script>

<div class="sw-header">
  {#if $resource}
    <div class="icon">
      {#if $resource.icon}
        <MimeIcon
          type={$resource.icon}
          small />
      {/if}
    </div>
    <div class="header-center">
      <div class="title">
        <h1>{$resource.title}</h1>
        {#if showMetadata}
          <div class="metadata">{formatDate($resource.modified)}</div>
        {/if}
      </div>
    </div>
    {#if getWidgetActions().length > 0}
      <div class="actions">
        <button on:click={() => (showMetadata = !showMetadata)}>
          {#if showMetadata}
            <img
              src={`${getCDN()}icons/close.svg`}
              alt="close" />
          {:else}
            <img
              src={`${getCDN()}icons/info.svg`}
              alt="icon" />
          {/if}
        </button>
        <ActionMenu uid={$resource.id} />
      </div>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./Header.scss"></style>
